const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const fs = require('fs')
dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

});

const uploadFile = (file, bucketname) => {
  return new Promise((resolve, reject) => {
    // const file = files.image[0];
    // console.log(file,bucketname);
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${bucketname}/${Date.now() + "_" + file.originalFilename}`,
      Body: fs.createReadStream(file.filepath),
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    s3Client.send(command, (err, data) => {
      if (err) {
        reject("File not uploaded");
      } else {
        // console.log(data);
        let location = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
        console.log(location);
        resolve(location);
      }
    });
  });
};

const uploadFile2 = (file, bucketname) => {
  return new Promise((resolve, reject) => {
    // const file = files.image[0];
    // console.log(file,bucketname);
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${bucketname}/${Date.now() + "_" + file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    s3Client.send(command, (err, data) => {
      if (err) {
        reject("File not uploaded");
      } else {
        // console.log(data);
        let location = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
        console.log(location);
        resolve(location);
      }
    });
  });
};


const getUrlFileKey = (url) => {
  const regex = /^https?:\/\/([^\.]+)\.s3.amazonaws.com\/(.+)$/;
  const match = url.match(regex);
  if (match) {
    return match[2]; // file key is in group 2
  } else {
    throw new Error(`Invalid S3 URL: ${url}`);
  }
};

const deleteFile = async (url) => {
  
 const fileKey= getUrlFileKey(url)
 console.log(fileKey);
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Delete: {
      Objects: [{ Key: fileKey }],
    },
  };

  try {
    const data = await s3Client.destroy(params);
    return data;
  } catch (err) {
    throw new Error(`Error deleting file: ${err.message}`);
  }
};

const updateFile = async (fileKey, newFile) => {
  await deleteFile(fileKey); // Delete the old file first

  const params = {
    ACL: "public-read",
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileKey,
    Body: newFile.buffer,
  };

  try {
    const command = new PutObjectCommand(params);
    const data = await s3Client.send(command);
    return data.Location;
  } catch (err) {
    throw new Error(`Error updating file: ${err.message}`);
  }
};

const multifileUpload = async (files, bucketname) => {
  return Promise.all(
    files.map((file) => {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${bucketname}/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
      };

      return new Promise((resolve, reject) => {
        s3Client.send(new PutObjectCommand(params), (err, data) => {
          if (err) {
            reject(err);
          } else {
            let location = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
            console.log(location);
            resolve(location);
          }
        });
      });
    })
  );
};

module.exports= { uploadFile,uploadFile2, deleteFile, updateFile, multifileUpload };