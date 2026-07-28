const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/updates');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {

    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueSuffix + '-' +
      file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    );

  }

});


const upload = multer({

  storage,

  limits:{
    fileSize:10 * 1024 * 1024 // 10MB images
  },

  fileFilter:(req,file,cb)=>{

    if(file.mimetype.startsWith('image/')){
      cb(null,true);
    }
    else{
      cb(new Error('Only images are allowed'));
    }

  }

});


module.exports = upload;