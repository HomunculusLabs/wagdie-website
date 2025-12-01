#!/usr/bin/env node

/**
 * Migration Framework CLI Entry Point
 */

import { Command } from 'commander';
import { loadDotenv } from '../utils/env.js';
import { StartCommand } from './commands/StartCommand.js';
import { StatusCommand } from './commands/StatusCommand.js';
import { ResumeCommand } from './commands/ResumeCommand.js';
import { ValidateCommand } from './commands/ValidateCommand.js';
import { RollbackCommand } from './commands/RollbackCommand.js';
import { PauseCommand } from './commands/PauseCommand.js';
import { LogsCommand } from './commands/LogsCommand.js';

// Load environment variables
loadDotenv();

const program = new Command();

program
  .name('wagdie-migrate')
  .description('WAGDIE Database Migration Framework')
  .version('1.0.0');

// Register commands
program.addCommand(new StartCommand());
program.addCommand(new StatusCommand());
program.addCommand(new ResumeCommand());
program.addCommand(new ValidateCommand());
program.addCommand(new RollbackCommand());
program.addCommand(new PauseCommand());
program.addCommand(new LogsCommand());

// Parse command line arguments
program.parse();