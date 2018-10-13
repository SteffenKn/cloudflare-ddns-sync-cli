# Cloudflare-DDNS-Sync

[![NPM](https://nodei.co/npm/cloudflare-ddns-sync-cli.png)](https://nodei.co/npm/cloudflare-ddns-sync-cli/)

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

- cds configuration
- cds config
- cds addRecords
- cds removeRecords
- cds sync <ip>

### cds configuration

Start the configuration tool of Cloudflare-DDNS-Sync.

### cds config

Show the configuration of Cloudflare-DDNS-Sync.

### cds addRecords

Add a record to the existing configuration

### cds removeRecords

Remove a record from the existing configuration

### cds sync <ip>

Sync the DNS Record. If the ip is not set it will simply use your external ip.

For example:
```
  cds sync 8.8.8.8
```

## Get Your Cloudflare API Key

- Go to **[Cloudflare](https://www.cloudflare.com)**
- **Log In**
- In the upper right corner: **click on your email address**
- Go to **"My Profile"**
- In the "API Key"-Section: **click on the "View API Key"-Button of the Global Key**
- **Enter your password** and **fill the captcha**
- **Copy the API Key**

## Changelog

### v0.0.2

- 🐛 **Fix Sync When CDS is Not Configured**

### v0.0.1

- ✨ **Add Basic Functionality**
