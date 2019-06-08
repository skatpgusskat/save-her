# Set up for local development

S3 on local

```
docker run --name sh-minio -d -p 9000:9000 -e MINIO_ACCESS_KEY='123' -e MINIO_SECRET_KEY='12345678' minio/minio server /data
```

MySQL on local

```
docker run --name sh-mysql -d -p 3306:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD='true' mysql:5.6

// make database
docker exec -it sh-mysql mysql -u root -e "CREATE DATABASE development"
```

Restart containers

```
docker restart sh-minio
docker restart sh-mysql
```