const FormData = require("form-data");
const axios = require("axios");
const fs = require("fs");
const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");
const env = require("../util/validateEnv");
const adminPostModel = require("../models/adminPost/adminPostModel");

// Get posts
exports.getPosts = catchAsync(async (req, res) => {
    const posts = await adminPostModel.find({}).sort({ createdAt: -1 });
    res.status(200).json({ posts });
});



// Add post
exports.uploadPost = catchAsync(async (req, res) => {
    const fileType = req.query?.fileType;
    const { postTitle } = req.body;

    const file = req.file;
    if (!file) throw new AppError({ statusCode: 400, message: 'File upload failed' });

    if (fileType !== 'image') {
        throw new AppError({ statusCode: 400, message: 'Only image uploads are allowed' });
    }

    // Read the image file as binary data
    const fileData = fs.readFileSync(file.path);

    // Create a new FormData object
    const formData = new FormData();
    formData.append('file', fileData, { filename: file.originalname });

    try {
        const content = await imagepost(formData);
        await adminPostModel.create({
            content,
            contentType: 'image',
            title: postTitle,
        });
    } catch (error) {
        console.log(error);
        throw new AppError({ statusCode: 400, message: 'File upload to Cloudflare failed' });
    } finally {
        // Delete the local image file
        fs.unlinkSync(file.path);
    }

    res.sendStatus(200);
});



// Update post
exports.updatePost = catchAsync(async (req, res) => {
    const postId = req.query?.postId;
    const postDetails = req.body;

    console.log(postId, postDetails);

    if (!postId || !postDetails) {
        throw new AppError({ name: 'Bad Request', statusCode: 400, message: 'Non-sufficient input' });
    }
    await adminPostModel.findByIdAndUpdate(postId, { $set: postDetails });
    res.sendStatus(200);
});



// Delete post
exports.deletePost = catchAsync(async (req, res) => {
    const postId = req.query?.postId;
    if (!postId) throw new AppError({ name: 'No ID', statusCode: 400, message: 'Post ID required.' });

    const post = await adminPostModel.findByIdAndDelete(postId);

    if (!post) {
        throw new AppError({ statusCode: 400, message: 'Invalid post ID' });
    } else if (post.contentType === 'image') {
        const imageId = post.content.id;
        const options = {
            method: 'DELETE',
            url: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
            headers: {
                'Authorization': `Bearer ${env.CLOUDFLARE_API_KEY}`
            },
        };

        await axios.request(options);
    }

    res.sendStatus(200);
});




// Image post
const imagepost = async (formData) => {
    const options = {
        method: 'POST',
        url: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${env.CLOUDFLARE_API_KEY}`
        },
        data: formData
    };

    const { data } = await axios.request(options);
    return { id: data.result.id, url: data.result.variants[0] };
}
