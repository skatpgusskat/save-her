
S3 on local
```
docker run --name sh-minio -d -p 9000:9000 -e MINIO_ACCESS_KEY='123' -e MINIO_SECRET_KEY='12345678' minio/minio server /data
```