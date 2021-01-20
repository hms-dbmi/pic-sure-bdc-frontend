#!/bin/bash

DOCKER_IMAGE=markhobson/maven-firefox

docker pull $DOCKER_IMAGE
#docker run -it -v "$PWD":/usr/src -w /usr/src $DOCKER_IMAGE mvn clean verify
docker run -it --memory 12000mb -v "$PWD":/usr/src -w /usr/src --env MAVEN_OPTS="-Xmx2048m" $DOCKER_IMAGE mvn test -Dpathtoconfigtest="src/test/resources/" -Dusername="$1" -Dpassword="$2" 
