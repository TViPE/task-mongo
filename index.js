var fs = require('fs');
var express = require('express');
var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));


//bodyParser
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});

//multer
var multer = require('multer');
var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, 'public/img/upload');
	},
	filename: function(req, file, cb) {
		cb(null, Date.now() + "-" + file.originalname);
	}
});
var upload = multer({storage: storage}).single('imageFile');


//mongoDB
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/todo');
db = mongoose.connection;
db.on('error',console.error.bind(console, 'connection error: '));
db.once('open', function(){
	console.log('Database Open');
});

var taskSchema = mongoose.Schema({
	id: Number,
	title: String,
	description: String,
	image: {
		data: Buffer,
		imagePath: String,
		contentType: String
	},
	created_at: Date,
	updated_at: Date,
});

taskSchema.pre('save', function(next){
	var currentDate = new Date();
	this.updated_at = currentDate;

	if(!this.created_at){
		this.created_at = currentDate;
	}
	next();
});

var Task = mongoose.model('task', taskSchema);
// var task_01 = new Task({
// 	id: 0,
// 	title: 'task01',
// 	description: 'task01_desc'
// });
// task_01.save(function(err, data){
// 	if(err) {
// 		console.log(err);
// 	}
// 	console.log(data);
// })

//App
app.listen(3000);
app.get('/', function (req, res){
	try {
		Task.find({}, function (err, doc){
			if(err) {
				res.send(err);
			}
			res.render('mainpage', {data: doc});
		})
	} catch (e) {
		res.send(e);
	}	
});

app.get('/admin', function (req, res){
	res.render('addTask');
});

app.post('/upload', urlencodedParser, function(req, res){
	upload(req, res, function (err){
		if(err){
			console.log(err);
		}
		var id = req.body.id;
		var title = req.body.title;
		var description = req.body.description;
		
		//var image = req.file.filename;
		// console.log('filename: ' + req.file);

		// exclude 'public' keyword from image path because already use 
		// 'public' as static 
		var imagePath = req.file.path.slice(7);
		//console.log('imagePath' +  imagePath);

		var aTask =  new Task({
			id: id,
			title: title,
			description: description,
			image: {
				data: imagePath,
				imagePath: req.file.path,
				contentType: 'image/jpg'
			}
		});
		aTask.save(function(err, data){
			if(err) {
				console.log(err);
			}
			//console.log(data);
		});
		res.redirect('/');
	});
});	

app.get('/remove/:id', function (req,res){
	var removeId = req.params.id;
	var removeTask;
	Task.findOne({id:removeId}, function(err, task){
		if(err){
			console.log(err);
		}
		removeTask = task;
		console.log(removeTask.image.imagePath);
	});
	Task.remove({id: removeId}, function(err){
		//mus delete image in public folder
		if(err){
			console.log(err);
		}
		fs.unlink('./'+ removeTask.image.imagePath);
		res.redirect('/');
	})
});

