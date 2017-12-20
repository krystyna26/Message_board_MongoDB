var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var mongoose = require('mongoose');
var session = require('express-session');

mongoose.connect('mongodb://localhost/messageDB'); // name of db
mongoose.Promise = global.Promise;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({secret: 'codingdojorocks'})); 
app.use(express.static(path.join(__dirname, './static')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// -------------------------------------------
var Schema = mongoose.Schema;

var MessageSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Name cannot be blank"], minlength: [4, "Name has to have at least 4 characters."] },
    message: {type: String, required: [true, "Message cannot be blank"], minlength: [4, "Message has to have at least 4 characters."] }, 
    comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}]
}, { timestamps: true });

var CommentSchema = new mongoose.Schema({
    _message: {type: Schema.Types.ObjectId, ref: 'Message'},
    name : {type: String, required: [true, "Name cannot be blank"], minlength: [4,"Name has to have at least 4 characters." ]},
    text: {type: String, required: [true, "Comment cannot be empty"], minlength: [4, "Comment has to have at least 4 characters."]},
}, {timestamps: true });

// set models by passing them their respective Schemas
mongoose.model("Message", MessageSchema);
mongoose.model("Comment", CommentSchema);

// store models in variables
var Message = mongoose.model("Message");
var Comment = mongoose.model("Comment");

// ------ Displaying all messages: ------------------
app.get('/', function(req, res){
    Message.find({})
    .populate('comments')
    .exec(function(err, messages){
        if(err){
            console.log("something went wrong in retrieving messages")
        }else{
            console.log("successfully displayed all the messages!");
            res.render('index', {messages_in_index: messages, session: req.session});
        }
    })
});

// ----- Adding a message -----------------------
app.post('/posts', function (req, res){
    console.log("Post data:", req.body);
    var new_message = new Message({name: req.body.name, message: req.body.message});
    new_message.save(function(err){
        if(err){
            console.log("something went wrong in adding message");
            req.session.message_errors = new_message.errors
            res.redirect('/');
        }else{
            console.log("successfully added message");
            req.session.message_errors = undefined;
            res.redirect('/');
        }
    })
});

// ----- Adding a comment -----------------------
app.post('/posts/:id', function (req, res){
    Message.findOne({_id: req.params.id}, function(err, message){
        // data from form on the front end
        var new_comment = new Comment({
            name: req.body.name, 
            text: req.body.text, 
            _message : message._id});
        // now save both to the DB
        new_comment.save(function(err){
            if (err) {
                console.log('Error in adding comment');
                req.session.comment_errors = new_comment.errors
                res.redirect('/');
            } else {
                message.comments.push(new_comment);
                message.save(function(err){
                    if(err) {
                        console.log("message didn't save", err);
                    } else {
                        console.log("updated message saved");
                    }
                console.log("successfully added comment");
                req.session.comment_errors = undefined;
                res.redirect('/');
                });
            }
        });
    });
});



// --------------------------------------
 // Setting our Server to Listen on Port: 8000
 app.listen(8000, function() {
    console.log("listening on port 8000");
})