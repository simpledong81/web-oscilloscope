#!/bin/bash
profile="$1" # 暂时未使用
version="$2"
service="napir-wo"
echo ${service}:${version}

docker build -t ${service}:${version} -f Dockerfile .
docker tag ${service}:${version} ginza.enapir.com:1080/sol/${service}:${version}
echo "登录Harbor"
docker login -u admin -p \(Napir\)harbor ginza.enapir.com:1080
echo "上传镜像"
docker push ginza.enapir.com:1080/sol/${service}:${version}
