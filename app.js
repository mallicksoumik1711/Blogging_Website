const express = require('express');
const app = express();
const path = require('path');

const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

app.use(cookieParser());

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// models
const userModel = require('./models/user');
const postModel = require('./models/post');

// all get routes

app.get('/', function (req, res) {
    res.render("index");
})

app.get('/all-blogs', getUser, async function (req, res) {
    let user = null;
    if (req.userData && req.userData.email) {
        user = await userModel.findOne({ email: req.userData.email });
    }

    const posts = await postModel.find().populate('user').sort({ createdAt: -1 });

    res.render('allBlogs', { user, posts });
});


app.get('/login', function (req, res) {
    res.render('login');
})

app.get('/register', function (req, res) {
    res.render('register');
})

app.get('/create-blog', isLogggedin, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    res.render('createBlog', { user });
})

app.get('/my-posts', isLogggedin, async function (req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    let myPosts = await postModel.find({ user: user._id }).sort({ createdAt: -1 });
    res.render('myBlogs', { myPosts, user });
})

app.get('/edit/:id', isLogggedin, async function (req, res) {
    const postId = req.params.id;
    const user = await userModel.findOne({ email: req.user.email });
    const post = await postModel.findById(postId);
    res.render('editBlog', { post, user });
});


app.get('/logout', function (req, res) {
    res.cookie('token', '');
    res.redirect('/login');
})

// post routes

app.post('/register', async function (req, res) {
    let { username, email, password, confirmpassword } = req.body;
    if (!username || !email || !password || !confirmpassword) {
        return res.send("Fields missing...");
    }
    if (password != confirmpassword) {
        return res.send("password and confirmpassword both field is different");
    }

    let user = await userModel.findOne({ email });
    if (user) {
        return res.send("User with this email already exist");
    }

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
            let createdUser = await userModel.create({
                username,
                email,
                password: hash,
                confirmpassword: hash
            })

            let token = jwt.sign({ email: createdUser.email, userId: createdUser._id }, 'shhhhhhhhhhhhhhhhhhhhh');
            res.cookie('token', token);
            res.redirect('/login');
        })
    })
})

app.post('/login', async function (req, res) {
    let { email, password } = req.body;
    if (!email || !password) {
        return res.send("fields missing...");
    }
    let user = await userModel.findOne({ email });
    if (!user) {
        return res.send("No user with this email is registered");
    }

    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: user.email, userId: user._id }, 'shhhhhhhhhhhhhhhhhhhhh');
            res.cookie('token', token);
            res.redirect('/create-blog');
        }
        else {
            return res.send('error while login');
        }
    })
})

app.post('/create-blog-post', isLogggedin, async function (req, res) {
    let { title, content } = req.body;
    if (!title || !content) {
        return res.send("fields mising...");
    }
    let user = await userModel.findOne({ email: req.user.email });
    let createdPost = await postModel.create({
        title,
        content,
        user: user._id
    })

    user.posts.push(createdPost._id);
    await user.save();
    res.redirect('/all-blogs');
})

app.post('/delete/:id', isLogggedin, async function (req, res) {
    const postId = req.params.id;
    const user = await userModel.findOne({ email: req.user.email });

    const post = await postModel.findById(postId);

    await postModel.findByIdAndDelete(postId);

    // remove the post from the array
    user.posts.pull(postId);
    await user.save();

    res.redirect('/my-posts');
});

app.post('/edit/:id', isLogggedin, async function (req, res) {
    const postId = req.params.id;
    const { title, content } = req.body;
    const user = await userModel.findOne({ email: req.user.email });

    const post = await postModel.findById(postId);

    if (!post || post.user.toString() !== user._id.toString()) {
        return res.status(403).send("Unauthorized to edit this post");
    }

    post.title = title;
    post.content = content;
    await post.save();

    res.redirect('/my-posts');
});

// protected routes

function isLogggedin(req, res, next) {
    if (req.cookies.token === "") {
        return res.send("User is not logged in");
    }
    else {
        let data = jwt.verify(req.cookies.token, 'shhhhhhhhhhhhhhhhhhhhh');
        req.user = data;
    }
    next();
}

function getUser(req, res, next) {
    const token = req.cookies.token;
    if (token) {
        try {
            const userData = jwt.verify(token, 'shhhhhhhhhhhhhhhhhhhhh');
            req.userData = userData;
        } catch (err) {
            req.userData = null; // clear if invalid
        }
    } else {
        req.userData = null; // clear if not present
    }
    next();
}

app.listen(3000, function () {
    console.log("Running");
})