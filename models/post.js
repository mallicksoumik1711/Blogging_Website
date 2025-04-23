const mongoose = require('mongoose');

let postSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    title: String,
    content: String, 
}, { timestamps: true })

module.exports = mongoose.model('post', postSchema);