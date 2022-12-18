# Cloudflare-DDNS-Sync-CLI

[![NPM](https://nodei.co/npm/cloudflare-ddns-sync-cli.png)](https://nodei.co/npm/cloudflare-ddns-sync-cli/)

You may also have a look at Cloudflare-DDNS-Sync:
[![NPM](https://nodei.co/npm/cloudflare-ddns-sync.png)](https://nodei.co/npm/cloudflare-ddns-sync/)

## Overview

Cloudflare-DDNS-Sync-CLI is a cli for the NPM package [Cloudflare-DDNS-Sync](https://www.npmjs.com/package/cloudflare-ddns-sync).
Cloudflare-DDNS-Sync is a simple NPM package that updates the IP address of
Cloudflare DNS records.

## What are the goals of this project?

The goal of Cloudflare-DDNS-Sync-CLI is to make updating the IP of Cloudflare DNS
records as easy as possible, without the need of any coding experience.

## How do I set this project up?

### Prerequisites

- Node
- Cloudflare Account

### Installation

To install Cloudflare-DDNS-Sync-CLI simply run:

```
npm install -g cloudflare-ddns-sync-cli
```

## Usage

After installation, simply run `cds configuration` in your terminal to set up Cloudflare-DDNS-Sync.
Then you can run `cds sync` to sync the records that were configured earlier.
If you run the command with a valid ip like `cds sync 8.8.8.8` Cloudflare-DDNS-Sync will use the ip. Otherwise it will use your external ip.

## Commands

- cds help
- cds default
- cds configuration
- cds config
- cds addRecords
- cds removeRecords
- cds sync [ip]
- cds syncOnIpChange

### cds help

Shows everything that Cloudflare-DDNS-Sync-CLI can do.

### cds default

Set a default command. When a default command is set 'cds' can be used instead of that command-

For example when setting 'syncOnIpChange' as default, 'cds' will do the same as 'cds syncOnIpChange'.

### cds configuration

Start the configuration tool of Cloudflare-DDNS-Sync.

### cds config

Show the configuration of Cloudflare-DDNS-Sync.

### cds addRecords

Add a record to the existing configuration

### cds removeRecords

Remove a record from the existing configuration

### cds sync <ip>

Sync the DNS Records. If the ip is not set it will simply use your external ip.

For example:

```
  cds sync 8.8.8.8
```

### cds syncOnIpChange

Sync the DNS Records as soon as the external ip differs from the ip set in the configured DNS Records.

> Note: This will stop as soon as the terminal session ends, or when the command gets aborted.

## Get Your Cloudflare API Key

- Go to **[Cloudflare](https://www.cloudflare.com)**
- **Log In**
- In the upper right corner: **click on your email address**
- Go to **"My Profile"**
- In the "API Key"-Section: **click on the "View API Key"-Button of the Global Key**
- **Enter your password** and **fill the captcha**
- **Copy the API Key**

## Changelog

### v0.1.0

- ♻️ **Rewrite Code in TypeScript**

### v0.0.5

- ✨ **Add syncOnIpChange Functionality**
- ✨ **Add default Functionality**
- ✨ **Add Help Command**
- 💄 Improve Code Quality

### v0.0.4

- ✨ **Replace LowDB by Data-Store**

### v0.0.3

- 🐛 **Fix Other Functions When CDS is Not Configured**

### v0.0.2

- 🐛 **Fix Sync When CDS is Not Configured**

### v0.0.1

- ✨ **Add Basic Functionality**
