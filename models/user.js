const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/Blogging_Site');

let userSchema = ({
    username: String,
    email: String, 
    password: String,
    confirmpassword: String,
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'post'
        }
    ]
})

module.exports = mongoose.model('user', userSchema);