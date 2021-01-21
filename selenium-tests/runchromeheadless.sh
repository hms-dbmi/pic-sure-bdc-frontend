#!/bin/bash

DOCKER_IMAGE=markhobson/maven-chrome

docker pull $DOCKER_IMAGE

docker run -it -v "$PWD":/usr/src -v "$PWD"/tmp:/tmp -v "$PWD"/shm:/dev/shm -w /usr/src $DOCKER_IMAGE mvn test -Dpathtoconfigtest="src/test/resources/" -DbrowserName=chromeheadless -Dusername="$1" -Dpassword="$2"
