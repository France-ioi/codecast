#!/usr/bin/env python3
import argparse, json, os, requests, time

ENDPOINT_URL = 'https://codecast-backend.france-ioi.org'
HISTORY_FILE = os.path.expanduser('~/.fioi_history.json')


def history_load(idx=None):
    if idx is None:
        try:
            with open(HISTORY_FILE, 'r') as file:
                history = json.load(file)

            return history
        except:
            return []

    try:
        with open(HISTORY_FILE, 'r') as file:
            history = json.load(file)

        return history[idx]
    except:
        return None

def history_save(data):
    try:
        with open(HISTORY_FILE, 'r') as file:
            history = json.load(file)
    except:
        history = []

    history.insert(0, data)
    history = history[-10:]

    try:
        with open(HISTORY_FILE, 'w') as file:
            json.dump(history, file)
    except:
        pass


def make_payload_from_args(args):
    with open(args.file_path, 'r') as file:
        source_code = file.read()

    payload = {
        "token": args.token,
        "platform": args.platform,
        "answer": {
            "sourceCode": source_code,
            "fileName": os.path.basename(args.file_path),
            "language": args.language
        },
        "sLocale": "fr"
    }

    return payload


def send_submission(payload):
    url = f'{ENDPOINT_URL}/submissions-offline'
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 200:
        json_response = response.json()
        if json_response.get('success'):
            submission_id = json_response.get('submissionId')
            print('Submission sent successfully!')
            return submission_id
        else:
            print('Failed to send submission.')
    elif response.status_code == 500:
        print('Token is invalid.')
    else:
        print(f'Failed to send submission. Status code: {response.status_code}')


def check_submission_status(submission_id):
    url = f'{ENDPOINT_URL}/submissions/{submission_id}'
    print("Waiting for evaluation...", end='')
    while True:
        response = requests.get(url)
        if response.status_code == 200:
            json_response = response.json()
            if json_response.get('evaluated'):
                print(' evaluation successful!')
                return json_response
            else:
                print('.', end='')
                time.sleep(1)
        elif response.status_code == 404:
            print('Submission not found.')
            break
        else:
            print(f'Failed to check submission status. Status code: {response.status_code}')
            time.sleep(1)


def display_submission_info(data, verbose):
    print(f"Score: {data['score']}")

    if data["compilationError"]:
        print("Your submission did not compile:")
        print(data["compilationMessage"])
        return

    print(f"Passed {data['passedTestsCount']} out of {data['totalTestsCount']} tests.")
    if len(data["subTasks"]) > 0:
        print(f"Scores per subtask: {'+'.join(map(lambda x: str(x['score']), data['subTasks']))}")
        print()

    if not verbose:
        print("Use ./fioi.py display 0 -v to display individual test information.")
        return

    print()
    for idx, test in enumerate(data["tests"]):
        print(f"Test #{idx}")
        print("Score:", test["score"])
        if not test["noFeedback"]:
            if test["timeMs"] != -1:
                print(f"Time taken: {test['timeMs']}ms")
            if test["memoryKb"] != 0:
                print(f"Memory used: (KB): {test['memoryKb']}KB")
            if test["errorMessage"] != '':
                print("Error Code:", test["errorCode"])
                print("Error Message:", test["errorMessage"])
            if test["log"].strip() != '':
                print("Evaluation message:")
                print(test["log"].strip())
        else:
            print("Information for this test is hidden.")
        print()


def process_submit(args):
    payload = make_payload_from_args(args)
    submission_id = send_submission(payload)

    if submission_id is not None:
        result = check_submission_status(submission_id)
        if result is not None:
            print()
            display_submission_info(result, args.verbose)
            result["timestamp"] = time.time()
            history_save(result)


def process_display(args):
    data = history_load(args.idx)
    if args.idx is None:
        if data is None:
            print("No evaluations in history.")
            return
        for idx, history_data in enumerate(data):
            print(f"Submission #{idx} at {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(history_data['timestamp']))}, score {history_data['score']}")
        print("Specify a submission number to display.")
        return

    if data is not None:
        display_submission_info(data, args.verbose)
    else:
        print("Evaluation not found in history.")



if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    subparser = parser.add_subparsers(dest='command', help='Command to execute')

    # Create the parser for the "submit" command
    parser_submit = subparser.add_parser('submit', help='Submit a file')
    parser_submit.add_argument('file_path', help='Path to the file')
    parser_submit.add_argument('--language', help='Language name', required=True)
    parser_submit.add_argument('--platform', help='Platform name')
    parser_submit.add_argument('--token', help='Token')
    parser_submit.add_argument('-v', '--verbose', action='store_true', help='Display verbose output')

    # Create the parser for the "display" command
    parser_display = subparser.add_parser('display', help='Display information about a previous evaluation')
    parser_display.add_argument('idx', type=int, nargs='?', help='Index of the evaluation to display')
    parser_display.add_argument('-v', '--verbose', action='store_true', help='Display verbose output')

    args = parser.parse_args()

    if args.command == 'submit':
        process_submit(args)
    elif args.command == 'display':
        process_display(args)
    else:
        parser.print_help()
