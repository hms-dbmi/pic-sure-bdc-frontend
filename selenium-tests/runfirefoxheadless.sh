#!/bin/bash

DOCKER_IMAGE=markhobson/maven-firefox

docker pull $DOCKER_IMAGE

docker run -u root -it  -v "$PWD"/tmp:/tmp -v "$PWD":/usr/src -w /usr/src --env MAVEN_OPTS="-Xmx2048m" $DOCKER_IMAGE mvn test -Dpathtoconfigtest="src/test/resources/" -DbrowserName=firefoxheadless -Dusername="$1" -Dpassword="$2" 
