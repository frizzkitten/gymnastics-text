#! /bin/bash
port=1337
image_name="gymnasticstext_node-app"
build=1

function run_node_app {
    have_docker=0
    have_compose=0
    hash docker-compose 2>/dev/null || have_compose=1
    hash docker 2>/dev/null || have_docker=1

    if [ "$have_compose" -eq 0 ]; then
        if [ "$build" -eq 0 ]; then
            echo "Running docker-compose with build..."
            docker-compose up --build -d &>/dev/null
        else
            echo "Running docker-compose..."
            docker-compose up -d &>/dev/null
        fi

    elif [ "$have_docker" -eq 0 ]; then
        echo "No docker-compose, running with docker..."
        docker run --rm -it -v "$(pwd)":/app -p 1337:1337 $image_name /bin/bash
    else
        echo "No docker-compose or Docker, running with npm..."
        npm start &>/dev/null &
    fi
}


function run_ngrok {
    have_ngrok=0
    ngrok_local=0
    hash ngrok 2>/dev/null || have_ngrok=1

    if [ "$have_ngrok" -eq 0 ]; then
        echo "Ngrok in path..."
        ngrok http $port
    elif [ -e ./ngrok ]; then
        echo "Running local ./ngrok..."
        ./ngrok http $port
    else
        echo "Unable to run ngrok, exiting..."
        exit 1
    fi
}


function main {
    echo "Running GymnasticsText + Ngrok"
    echo "_______________________________"
    if [[ "$arg1" == "-h" ]]; then
        echo "run-local.sh [-h] [-b]"
        echo "-h, for help message"
        echo "-b, add build argument to Docker"
        exit 0
    elif [[ "$arg1" == "-b" ]]; then
        echo "Build option selected..."
        build=0
    fi

    run_node_app
    run_ngrok
    echo "Cleaning up container if needed..."
    echo "--> trying ${image_name}_1..."
    docker rm -f ${image_name}_1 || true
    echo "...done"
}

echo $1
arg1=$1
main

