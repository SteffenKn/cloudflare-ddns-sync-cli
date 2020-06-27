#!/usr/bin/env node
import CloudflareDDNSSync, {Record, RecordData} from 'cloudflare-ddns-sync';
import Storage from 'data-store';
import Readline from 'readline';

import {emailRegex, ipRegex, whitespaceRegex} from './regex';
import {DdnsConfig} from './types/index';

const storage: Storage = new Storage({ name: 'cloudflareConfig' });
const [, , cmd, ...args] = process.argv;
let defaultCommand: string = storage.get('defaultCommand');

evaluateJob(cmd);

function evaluateJob(command: string): void {
  const configurationSelected: boolean = command === 'configuration';
  const configSelected: boolean = command === 'config';
  const setDefaultSelected: boolean = command === 'default';
  const addRecordSelected: boolean = command === 'addRecords';
  const removeRecordSelected: boolean = command === 'removeRecords';
  const syncSelected: boolean = command && command.startsWith('sync');
  const syncOnIpSelected: boolean = command === 'syncOnIpChange';
  const helpSelected: boolean = command === 'help';

  const defaultSelected: boolean = command === undefined;

  if (helpSelected) {
    showUsage();
  } else if (configurationSelected) {
    setConfig();
  } else if (configSelected) {
    showConfig();
  } else if (setDefaultSelected) {
    setDefault();
  } else if (addRecordSelected) {
    addRecords();
  } else if (removeRecordSelected) {
    removeRecords();
  }  else if (syncSelected) {
    sync();
  } else if (syncOnIpSelected) {
    syncOnIpChange();
  } else if (defaultSelected) {
    runDefaultCommand();
  } else {
    showUsage();
  }
}

function showUsage(): void {
  console.log(
`
Usage:

  cds
    This runs the default command, if set.

  cds help
    Shows usage of Cloudflare-DDNS-Sync-CLI.

  cds configuration
    Start the configuration tool of Cloudflare-DDNS-Sync.

  cds config
    Show the configuration of Cloudflare-DDNS-Sync.

  cds default
    Sets the default command.

  cds addRecords
    Add a record to the existing configuration.

  cds removeRecords
    Remove a record from the existing configuration.

  cds sync <ip>
    Sync the DNS Record. If the ip is not set it will simply use your external ip.

  cds syncOnIpChange
    Sync the DNS Record every time your external ip differs from these from the configured records.
`);
}

function runDefaultCommand(): void {
  if (defaultCommand === undefined) {
    console.log(`Please set the default command first. To do so run 'cds default'`);

    return;
  }

  evaluateJob(defaultCommand);
}

function syncOnIpChange(): void {
  const ddnsConfig: DdnsConfig = getDdnsConfig();

  const configNotSet: boolean = ddnsConfig === undefined
                             || ddnsConfig.auth === undefined;

  if (configNotSet) {
    console.log(`You did not configure Cloudflare-DDNS-Sync yet. Please run 'cds configuration' first.`);

    return;
  }

  const cds: CloudflareDDNSSync = new CloudflareDDNSSync(ddnsConfig.auth.email, ddnsConfig.auth.key);
  console.log('Cloudflare-DDNS-Sync will now update the DDNS records when needed...');

  cds.syncOnIpChange(ddnsConfig.records, async(results: Array<RecordData>): Promise<void> => {
    for (const result of results) {
      console.log(result);
    }
  });
}

async function setDefault(): Promise<void> {
  console.log(
`
ID | Command
0    none
1    sync [ip]
2    syncOnIpChange
`,
  );

  const defaultCommandIsSet: boolean = defaultCommand !== undefined;
  if (defaultCommandIsSet) {
    console.log(`The current default function is '${defaultCommand}'. Press 'CTRL + C' or enter nothing to keep it.`);
  }

  const readline: Readline.Interface = createReadline();
  const command: string = await getDefaultCommand(readline);
  readline.close();

  defaultCommand = command;

  storage.set('defaultCommand', command);
}

async function getDefaultCommand(readline: Readline.Interface): Promise<string> {
  const defaultCommandAnswer: string = await ask(readline, 'Which command would you like to set as default (when running \'cds\')?\n');
  const defaultCommandIndex: string = defaultCommandAnswer.replace(whitespaceRegex, '');

  const defaultCommandIsNone: boolean = defaultCommandIndex === '0' || defaultCommandIndex === '';
  const defaultCommandIsSync: boolean = defaultCommandIndex === '1';
  const defaultCommandIsSyncOnIp: boolean = defaultCommandIndex === '2';

  if (defaultCommandIsNone) {
    return undefined;

  } else if (defaultCommandIsSync) {
    const ip: string = await ask(readline, 'Please enter an IP that should be used or leave this empty if it should get your external IP.\n');

    return 'sync ' + `${ip}`.replace(whitespaceRegex, '');
  } else if (defaultCommandIsSyncOnIp) {
    return 'syncOnIpChange';

  } else {
    return getDefaultCommand(readline);
  }
}

function sync(): void {
  const ddnsConfig: DdnsConfig = getDdnsConfig();

  const configNotSet: boolean = ddnsConfig === undefined
                             || ddnsConfig.auth === undefined;

  if (configNotSet) {
    console.log(`You did not configure Cloudflare-DDNS-Sync yet. Please run 'cds configuration' first.`);

    return;
  }

  const cds: CloudflareDDNSSync = new CloudflareDDNSSync(ddnsConfig.auth.email, ddnsConfig.auth.key);

  const ipAddressNotGiven: boolean = args.length < 1;

  if (ipAddressNotGiven) {
    cds.syncRecords(ddnsConfig.records)
    .then((results: Array<RecordData>): void => {
      for (const result of results) {
        console.log(result);
      }
    });

    return;
  }

  const ip: string = args[0];

  const ipAddressInvalid: boolean = ip.match(ipRegex) === null;
  if (ipAddressInvalid) {
    console.log(`'${ip}' is not a valid ip adress.`);

    return;
  }

  cds.syncRecords(ddnsConfig.records, ip)
  .then((results: Array<RecordData>): void => {
    for (const result of results) {
      console.log(result);
    }
  });
}

function showConfig(): void {
  const currentConfiguration: DdnsConfig = getDdnsConfig();

  const configurationNotSet: boolean = currentConfiguration === undefined
                                    || currentConfiguration.auth === undefined;

  if (configurationNotSet) {
    console.log(`You did not configure Cloudflare-DDNS-Sync yet. Please run 'cds configuration' first.`);

    return;
  }

  console.log(`Youre current configuration:\n${JSON.stringify(currentConfiguration, null, 2)}`);
}

async function setConfig(): Promise<void> {
  const readline: Readline.Interface = createReadline();

  const email: string = await getEmail(readline);
  const authKey: string = await getAuthKey(readline);
  const domain: string = await getDomain(readline);

  const recordNames: Array<string> = await getRecords(readline, domain);
  const records: Array<Record> = recordNames.map((recordName: string): Record => {
    return getRecordFromString(recordName);
  });

  readline.close();

  const ddnsConfig: DdnsConfig = {
    auth: {
      email: email,
      key: authKey,
    },
    domain: domain,
    records: records,
  };

  storage.set('cloudflareConfig', ddnsConfig);

  console.log(`Youre Configuration was successfully stored.`);
}

async function addRecords(): Promise<void> {
  const ddnsConfig: DdnsConfig = getDdnsConfig();

  const configNotSet: boolean = ddnsConfig === undefined
                    || ddnsConfig.auth === undefined;
  if (configNotSet) {
    console.log(`You did not configure Cloudflare-DDNS-Sync yet. Please run 'cds configuration' first.`);

    return;
  }

  const domain: string = ddnsConfig.domain;
  const readline: Readline.Interface = createReadline();

  const recordNamesToAddString: string = await ask(readline, 'Please enter all records that should be added. Seperate them with a comma (,):\n');
  const recordNamesToAdd: Array<string> = recordNamesToAddString.replace(whitespaceRegex, '').split(',');
  const recordsToAdd: Array<Record> = recordNamesToAdd.map((recordName: string): Record => {
    const recordNameIsEmpty: boolean = recordName.trim() === '';
    if (recordNameIsEmpty) {
      recordName = domain;
    } else {
      recordName += `.${domain}`;
    }

    return getRecordFromString(recordName);
  });

  readline.close();

  ddnsConfig.records = ddnsConfig.records.concat(recordsToAdd);

  ddnsConfig.records = ddnsConfig.records.filter((record: Record, recordIndex: number): boolean => {
      return ddnsConfig.records.indexOf(record) === recordIndex;
  });

  storage.set('cloudflareConfig', ddnsConfig);

  console.log('Records successfully added.');
}

async function removeRecords(): Promise<void> {
  const ddnsConfig: DdnsConfig = getDdnsConfig();

  const configNotSet: boolean = ddnsConfig === undefined
                             || ddnsConfig.auth === undefined;

  if (configNotSet) {
    console.log(`You did not configure Cloudflare-DDNS-Sync yet. Please run 'cds configuration' first.`);

    return;
  }

  const records: Array<Record> = ddnsConfig.records;

  console.log('These records are existing:\n\nID | Record');

  for (const recordIndex in records) {
    console.log(`${recordIndex}   ${records[recordIndex]}`);
  }

  const readline: Readline.Interface = createReadline();
  const recordIdsToRemoveString: string = await ask(readline, '\nPlease enter the ID of the records that should get removed. Seperate them with a comma (,):\n');
  const recordIdsToRemove: Array<string> = recordIdsToRemoveString.replace(whitespaceRegex, '').split(',');

  readline.close();

  for (const recordId of recordIdsToRemove) {
    try {
      records.splice(parseInt(recordId), 1);
    } catch {
      throw new Error(`'${recordId}' is not a valid id.`);
    }
  }

  ddnsConfig.records = records;

  storage.set('cloudflareConfig', ddnsConfig);

  console.log('Records successfully removed.');
}

function getDdnsConfig(): DdnsConfig {
  return storage.get('cloudflareConfig');
}

async function getEmail(readline: Readline.Interface): Promise<string> {
  const email: string = await ask(readline, 'Please enter your cloudflare email:\n');
  const emailIsInvalid: boolean = email.match(emailRegex) === null;

  if (emailIsInvalid) {
    console.log('\nThe email you entered is invalid please try again.');

    return getEmail(readline);
  }

  return email;
}

async function getAuthKey(readline: Readline.Interface): Promise<string> {
  return await ask(readline, 'Please enter your cloudflare authkey (How you can get it is described in the README):\n');
}

async function getDomain(readline: Readline.Interface): Promise<string> {
  return ask(readline, 'Please enter your domain:\n');
}

async function getRecords(readline: Readline.Interface, domain: string): Promise<Array<string>> {
  const recordString: string = await ask(readline, 'Please enter all records that should get synced. Seperate them by a comma (,):\n');
  const records: Array<string> = recordString.replace(whitespaceRegex, '').split(',');

  for (const recordIndex in records) {
    const recordIsEmpty: boolean = records[recordIndex] === '';

    if (recordIsEmpty) {
      records[recordIndex] = domain;
    } else {
      records[recordIndex] += `.${domain}`;
    }
  }

  return records;
}

function ask(readline: Readline.Interface, question: string): Promise<string> {
  return new Promise((resolve: Function): void => {
    readline.question(question, (answer: string): void => {
      resolve(answer);

      // Create NewLine after answer was entered
      console.log();

      return;
    });
  });
}

function getRecordFromString(recordName: string): Record {
  return {
    name: recordName,
    // Todo: Ask for the rest of the data
  };
}

function createReadline(): Readline.Interface {
  return Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}
