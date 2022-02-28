### MinIO setup
For local tests MinIO can be used as an object storage.  
The API of MinIO is compatible with the Amazon S3 cloud storage service.

To start a MinIO docker container run
```bash
docker run -p 9000:9000 -p 9001:9001 -v data:/data quay.io/minio/minio server /data --console-address ":9001" --address 0.0.0.0:9000
```

To open the console type `http://127.0.0.1:9001`  in the browser address bar with `minioadmin:minioadmin` as the default credentials.
