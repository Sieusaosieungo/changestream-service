# CHANGESTREAM-SERVICE

This is a service that allows to trigger data changes of an available database

## Requirements

- [GIT](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node](https://nodejs.org/en/download/) (or [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/))

**Notes**: You can skip installing Docker Compose as it is already included along with Docker Desktop for Windows.

## Getting Started

### Installation

```bash
$ git clone https://github.com/YOUR_USERNAME/changestream-service.git
$ cd changestream-service
```

- First, you need to run available database. This works include run the image of database with docker and import data from data dumped. For example, at docker-compose file: 

```bash
version: '3'

services:
  mongodb-sd:
    image: mongo:latest
    container_name: mongodb-sd
    restart: always
    volumes:
      - mongodb-sd:/data/db
    ports:
      - "${MONGO_PUBLIC_PORT}:${MONGO_PORT}"
    environment:
      - TZ=Asia/Ho_Chi_Minh
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    entrypoint: ['/usr/bin/mongod', '--bind_ip_all', '--replSet', 'devrs']
    
volumes:
  mongodb-sd:
```

- After that, you need to add entrypoint to available database and add info of replication databases that you want to use in replicaset. For example, I add mongo-r1 that is replication database for mongodb-sd (original database)

```bash
services:
  mongodb-sd:
    image: mongo:latest
    container_name: mongodb-sd
    restart: always
    volumes:
      - mongodb-sd:/data/db
    ports:
      - "${MONGO_PUBLIC_PORT}:${MONGO_PORT}"
    environment:
      - TZ=Asia/Ho_Chi_Minh
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    entrypoint: ['/usr/bin/mongod', '--bind_ip_all', '--replSet', 'devrs']
    networks:
      - app-network

  mongo-r1:
    hostname: mongo-r1
    container_name: mongo-r1
    image: mongo
    volumes:
      - ./data/data1/db:/data/db
      - ./data/data1/configdb:/data/configdb
    networks:
      - app-network
    expose:
      - 27017
    ports:
      - 30001:27017
    restart: always
    entrypoint: ['/usr/bin/mongod', '--bind_ip_all', '--replSet', 'devrs']
    environment:
      - TZ=Asia/Ho_Chi_Minh

volumes:
  mongodb-sd:
networks:
  app-network:
    driver: bridge
``` 

- Next, add your service image to docker-compose file

```bash
backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    restart: always
    volumes:
      - '..:/app'
    environment:
      - TZ=Asia/Ho_Chi_Minh
      - MONGO_HOST_ORIGINAL=${MONGO_HOST_ORIGINAL}
      - MONGO_HOST_R1=${MONGO_HOST_R1}
      - MONGO_PORT=${MONGO_PORT}
      - MONGO_DATABASE_MONITORED=${MONGO_DATABASE_MONITORED}
      - MONGO_COLLECTIONS_MONITORED=${MONGO_COLLECTIONS_MONITORED}
    depends_on:
      - mongodb-sd
      - mongo-r1
    networks:
      - app-network
```

- build and run project with docker:

```bash
$ cd docker
$ docker-compose build
$ docker-compose up -d
```

- config replica set:

```bash
$ docker-compose exec mongodb-sd mongo
...
> rs.initiate({
  _id: 'devrs',
  version: 1,
  members: [
    { _id: 0, host: 'mongodb-sd:27017' }, 
    { _id: 1, host: 'mongo-r1:27017' },
  ],
});
{
        "ok" : 1,
        "$clusterTime" : {
                "clusterTime" : Timestamp(1617591290, 1),
                "signature" : {
                        "hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
                        "keyId" : NumberLong(0)
                }
        },
        "operationTime" : Timestamp(1617591290, 1)
}
```

- after config replica set is done, check the replica set infomation:
```bash
devrs:PRIMARY> rs.printSecondaryReplicationInfo()
source: mongo-r1:27017
        syncedTo: Mon Apr 05 2021 09:55:21 GMT+0700 (+07)
        10 secs (0 hrs) behind the primary
```

- check log current service:
```bash
$ docker logs -f ID_CHANGESTREAM_SERVICE_CONTAINER 
```

