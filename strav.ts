#!/usr/bin/env bun
import 'reflect-metadata'
import { Command } from 'commander'
import { CommandLoader } from '@strav/cli'

// Each registered command bootstraps the services it needs (most use
// `bootstrap()` from @strav/cli's bootstrap.ts to spin up Configuration +
// Database). We deliberately don't boot the web provider list here, so
// running a command never tries to bind the HTTP port.
const program = new Command()
program.name('strav').description('StravTask CLI')

await CommandLoader.discover(program)

await program.parseAsync(process.argv)
