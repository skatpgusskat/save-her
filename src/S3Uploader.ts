import AWS from 'aws-sdk';
import crypto from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

const s3Option = isProduction
  ? {
    region: 'ap-northeast-2',
  }
  : {
    accessKeyId: '123',
    secretAccessKey: '12345678',
    endpoint: 'http://127.0.0.1:9000',
    s3ForcePathStyle: true, // needed with minio?
    signatureVersion: 'v4'
  };

const fileBucket = 'my-girl-friend';

export default class S3Uploader {
  private s3 = new AWS.S3(s3Option);
  public async init() {
    if (!isProduction) {
      const buckets = [
        fileBucket,
      ];
      await Promise.all(buckets.map(async bucket => {
        const isExists = await this.checkBucketExists(bucket);
        if (isExists) {
          return;
        }
        await this.createBucket(bucket);
        await this.makeBucketPublic(bucket);
      }));
    }
  }
  public async upload(file: Buffer, S3Key: string) {
    await this.s3.upload({
      Bucket: fileBucket,
      Key: S3Key,
      Body: file,
    }).promise();
  }
  private async checkBucketExists(bucket) {
    const params = {
      Bucket: bucket
    };
    try {
      await this.s3.headBucket(params).promise();
      return true;
    } catch (err) {
      if (err.code === 'NotFound') {
        return false;
      }
      throw err;
    }
  }
  private async createBucket(bucket: string) {
    console.log('createBucket : ', bucket);
    const params = {
      Bucket: bucket,
    };
    await this.s3.createBucket(params).promise();
  }
  private async makeBucketPublic(bucket: string) {
    console.log('makeBucketPublic : ', bucket);
    const params = {
      Bucket: bucket,
      Policy: JSON.stringify({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": `arn:aws:s3:::${bucket}/*`
          }
        ]
      })
    };
    await this.s3.putBucketPolicy(params).promise();
  }

  public encodeStringForS3Key(str: string) {
    return crypto.createHash('md5').update(str).digest("hex");
  }
}
