#! /usr/bin/env python3
import re
import requests
import argparse
import configparser


def send_request(url, body, number):
    data = {'Body':body, 'From': number}
    r = requests.post(url, data)
    if r.status_code != 200:
        print("Returned bad status code %d" % r.status_code)
    return r


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
    msg = re.sub('<[^>]*>', '', response.text)
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
