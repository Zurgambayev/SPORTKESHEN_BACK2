import AWS from 'aws-sdk';
import multer from 'multer';


AWS.config.update({
    accessKeyId: process.env.AWS_SECRET_KEY,
    secretAccessKey: process.env.AWS_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const storage = multer.memoryStorage();
export const upload = multer({storage: storage});
export const s3 = new AWS.S3();