#! /usr/bin/env python3
import re
from urllib import request, parse, error
import argparse
import configparser


# Returns HTTP Response object
def send_request(url, body, number):
    data = parse.urlencode({'Body':body, 'From': number}).encode()
    try:
        req = request.Request(url, data=data)
        response = request.urlopen(req)
    except error.HTTPError as e:
        print("HTTPError: %s" % e)
        raise SystemExit

    return response


def get_configs(config_fname):
    config = configparser.ConfigParser()
    try:
        config.read(config_fname)
    except configparser.MissingSectionHeaderError:
        print('Couldn\'t parse given config filename')
        raise SystemExit
    return config


def get_args():
    parser = argparse.ArgumentParser(description="Testing the GymnasticsText API")
    parser.add_argument('--user-tests', help='Run tests on user signup, etc. Make sure they aren\'t already in DB.')
    parser.add_argument('url', help='ngrok url to test, script handles correct path')
    return parser.parse_args()


def print_response_as_text(response):
    msg = re.sub('<[^>]*>', '', response.read().decode('utf-8'))
    print('------------')
    print(msg)
    print('------------')


def main():
    config_fname = 'config.ini'
    config = get_configs(config_fname)
    args = get_args()
    url = args.url + config['local']['path']

    print("Running tests on GymnasticsText..")
    body = config['local']['body']
    number = config['local']['number']
    r = send_request(url, body, number)
    print_response_as_text(r)

if __name__ == "__main__":
    main()
