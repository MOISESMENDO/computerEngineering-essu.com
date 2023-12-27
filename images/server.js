const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/socialmedia', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const postSchema = new mongoose.Schema({
  content: String,
  media: {
    type: String,
    data: Buffer
  },
  comments: [{
    content: String,
    date: { type: Date, default: Date.now }
  }],
  date: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/', async (req, res) => {
  const posts = await Post.find().sort({ date: -1 });
  res.render('index', { posts });
});

app.post('/postMessage', upload.single('mediaInput'), async (req, res) => {
  try {
    const userInput = req.body.userInput;
    const mediaData = req.file ? req.file.buffer : null;

    const newPost = new Post({
      content: userInput,
      media: mediaData
    });

    await newPost.save();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/postComment/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentInput = req.body.commentInput;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments.push({ content: commentInput });
    await post.save();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
