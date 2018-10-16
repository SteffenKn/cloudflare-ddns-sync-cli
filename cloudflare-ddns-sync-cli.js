#!/usr/bin/env node

'use strict';

// Readline
const Readline = require('readline');

// CLI-Storage
const Storage = require('data-store');
const storage = new Storage({ name: 'cloudflareConfig' });

// Cloudflare-DDNS-Sync
const CloudflareDDNSSync = require("cloudflare-ddns-sync");

// Regex
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const whitespaceRegex = /\s+/g;

// Variables
const [, , cmd, ...args] = process.argv;
let defaultCommand = storage.get('defaultCommand');

evaluateJob(cmd);

function evaluateJob(command) {
  const configurationSelected = command === 'configuration';
  const configSelected = command === 'config';
  const setDefaultSelected = command === 'default';
  const addRecordSelected = command === 'addRecords';
  const removeRecordSelected = command === 'removeRecords';
  const syncSelected = command === 'sync';
  const syncOnIpSelected = command === 'syncOnIpChange';
  const helpSelected = command === 'help';

  const defaultSelected = command === undefined;

  if(helpSelected) {
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

function showUsage() {
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

function runDefaultCommand() {
  if(defaultCommand === undefined) {
    console.log(`Please set the default command first. To do so run 'cds default'`);

    return;
  }

  evaluateJob(defaultCommand);
}

function syncOnIpChange() {
  const ddnsConfig = getDdnsConfig();

  const configNotSet = ddnsConfig === undefined
                    || ddnsConfig.auth === undefined;

  if (configNotSet) {
    console.log(`You did not configure Cloudflare-DDNS-Sync yet. Please run 'cds configuration' first.`);

    return;
  }

  const cds = new CloudflareDDNSSync(ddnsConfig);
  console.log('Cloudflare-DDNS-Sync will now update the DDNS records when needed...');

  cds.syncOnIpChange(async (response) => {
    const results = await response;

    for(const result of results) {
      console.log(result);
    }
  });
}

async function setDefault() {
  console.log(
`
ID | Command
0    none
1    sync [ip]
2    syncOnIpChange
`
  );

  const defaultCommandIsSet = defaultCommand !== undefined;
  if(defaultCommandIsSet) {
    console.log(`The current default function is '${defaultCommand}'. Press 'CTRL + C' or enter nothing to keep it.`);
  }

  const readline = createReadline();
  const command = await getDefaultCommand(readline);
  readline.close();

  defaultCommand = command;

  storage.set('defaultCommand', command);
}

async function getDefaultCommand(readline) {
  const defaultCommandIndex = (await ask(readline, "Which command would you like to set as default (when running 'cds')?")).replace(whitespaceRegex, '');

  const defaultCommandIsNone = defaultCommandIndex === '0' || defaultCommandIndex === '';
  const defaultCommandIsSync = defaultCommandIndex === '1';
  const defaultCommandIsSyncOnIp = defaultCommandIndex === '2';

  if (defaultCommandIsNone) {
    return undefined;

  } else if (defaultCommandIsSync) {
    const ip = await ask(readline, "Please enter an IP that should be used or leave this empty if it should get your external IP.");

    return `sync ${ip}`.replace(whitespaceRegex, '');
  } else if (defaultCommandIsSyncOnIp) {
    return 'syncOnIpChange';

  } else {
    return getDefaultCommand(readline);
  }
}

function sync() {
  const ddnsConfig = getDdnsConfig();

  const configNotSet = ddnsConfig === undefined
                    || ddnsConfig.auth === undefined;

  if (configNotSet) {
    console.log(`You did not configure Cloudflare-DDNS-Sync yet. Please run 'cds configuration' first.`);

    return;
  }

  const cds = new CloudflareDDNSSync(ddnsConfig);

  const ipAddressNotGiven = args.length < 1;

  if (ipAddressNotGiven) {
    cds.sync()
    .then((results) => {
      for(const result of results) {
        console.log(result);
      }
    });

    return;
  }

  const ip = args[0];

  const ipAddressInvalid = ip.match(ipRegex) === null;
  if (ipAddressInvalid) {
    console.log(`'${ip}' is not a valid ip adress.`);

    return;
  }

  cds.sync(ip)
  .then((results) => {
    for(const result of results) {
      console.log(result);
    }
  });
}

function showConfig() {
  const currentConfiguration = getDdnsConfig();

  const configurationNotSet = currentConfiguration === undefined
                           || currentConfiguration.auth === undefined;
  if (configurationNotSet) {
    console.log(`You did not configure Cloudflare-DDNS-Sync yet. Please run 'cds configuration' first.`);

    return;
  }

  console.log(`Youre current configuration:\n${JSON.stringify(currentConfiguration, null, 2)}`);
}

async function setConfig() {
  const readline = createReadline();

  const email = await getEmail(readline);
  const authKey = await getAuthKey(readline);
  const domain = await getDomain(readline);
  const records = await getRecords(readline, domain);

  readline.close();

  const ddnsConfig = {
    "auth": {
      "email": email,
      "key": authKey
    },
    "domain": domain,
    "records": records
  };

  storage.set('cloudflareConfig', ddnsConfig);

  console.log(`Youre Configuration was successfully stored.`);
}

async function addRecords() {
  const ddnsConfig = getDdnsConfig();

  const configNotSet = ddnsConfig === undefined
                    || ddnsConfig.auth === undefined;
  if (configNotSet) {
    console.log(`You did not configure Cloudflare-DDNS-Sync yet. Please run 'cds configuration' first.`);

    return;
  }

  const domain = ddnsConfig.domain;
  const readline = createReadline();

  const recordsToAddString = await ask(readline, 'Please enter all records that should be added. Seperate them with a comma (,):\n');
  const recordsToAdd = recordsToAddString.replace(whitespaceRegex, '').split(',');

  readline.close();

  for (const recordIndex in recordsToAdd) {
    const recordIsEmpty = recordsToAdd[recordIndex] === "";
    if (recordIsEmpty) {
      recordsToAdd[recordIndex] = domain;
    } else {
      recordsToAdd[recordIndex] += `.${domain}`;
    }
  }

  ddnsConfig.records = ddnsConfig.records.concat(recordsToAdd);

  ddnsConfig.records = ddnsConfig.records.filter((record, recordIndex) => {
      return ddnsConfig.records.indexOf(record) == recordIndex;
  });

  storage.set('cloudflareConfig', ddnsConfig);

  console.log('Records successfully added.');
}

async function removeRecords() {
  const ddnsConfig = getDdnsConfig();

  const configNotSet = ddnsConfig === undefined
                    || ddnsConfig.auth === undefined;
  if (configNotSet) {
    console.log(`You did not configure Cloudflare-DDNS-Sync yet. Please run 'cds configuration' first.`);

    return;
  }

  const records = ddnsConfig.records;

  console.log('These records are existing:\n\nID | Record')
  for (const recordIndex in records) {
    console.log(`${recordIndex}   ${records[recordIndex]}`);
  }

  const readline = createReadline();
  const recordIdsToRemoveString = await ask(readline, '\nPlease enter the ID of the records that should get removed. Seperate them with a comma (,):\n');
  const recordIdsToRemove = recordIdsToRemoveString.replace(whitespaceRegex, '').split(',');

  readline.close();

  for (const recordId of recordIdsToRemove) {
    records.splice(recordId, 1);
  }

  ddnsConfig.records = records;

  storage.set('cloudflareConfig', ddnsConfig);

  console.log('Records successfully removed.')
}

function getDdnsConfig() {
  return storage.get('cloudflareConfig');
}

async function getEmail(readline) {
  const email = await ask(readline, 'Please enter your cloudflare email:\n');
  const emailIsInvalid = email.match(emailRegex) === null;

  if(emailIsInvalid) {
    console.log('\nThe email you entered is invalid please try again.');

    return getEmail(readline);
  }

  return email;
}

async function getAuthKey(readline) {
  return await ask(readline, 'Please enter your cloudflare authkey (How you can get it is described in the README):\n');
}

async function getDomain(readline) {
  return ask(readline, 'Please enter your domain:\n');
}

async function getRecords(readline, domain) {
  const recordString = await ask(readline, 'Please enter all records that should get synced. Seperate them by a comma (,):\n');
  const records = recordString.replace(whitespaceRegex, '').split(',');

  for (const recordIndex in records) {
    const recordIsEmpty = records[recordIndex] === "";

    if (recordIsEmpty) {
      records[recordIndex] = domain;
    } else {
      records[recordIndex] += `.${domain}`;
    }
  }

  return records;
}

function ask(readline, question){
  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      resolve(answer);

      // Create NewLine after answer was entered
      console.log();

      return;
    })
  });
}

function createReadline() {
  return Readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}
