// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import {
  FileSystem,
  JsonFile,
  Terminal,
  ConsoleTerminalProvider
} from '@microsoft/node-core-library';
import * as glob from 'glob';
import * as path from 'path';
import { EOL } from 'os';

import { ILocFile } from './interfaces';
import { ResxReader } from './utilities/ResxReader';
import { Constants } from './utilities/Constants';
import {
  Logging,
  ILoggingFunctions
} from './utilities/Logging';

/**
 * @public
 */
export interface ILocFilePreprocessorOptions {
  terminal: Terminal;
  srcFolder: string;
  generatedTsFolder: string;
  exportAsDefault?: boolean;
  filesToIgnore?: string[];
}

/**
 * This is a simple tool that generates .d.ts files for .loc.json and .resx files.
 *
 * @public
 */
export class LocFilePreprocessor {
  private _options: ILocFilePreprocessorOptions;
  private _loggingOptions: ILoggingFunctions;

  public constructor(options: ILocFilePreprocessorOptions) {
    this._options = {
      filesToIgnore: [],
      ...options
    };

    if (!this._options.terminal) {
      this._options.terminal = new Terminal(new ConsoleTerminalProvider({ verboseEnabled: true }));
    }

    this._loggingOptions = Logging.getLoggingFunctions({
      writeError: this._options.terminal.writeErrorLine.bind(this._options.terminal),
      writeWarning: this._options.terminal.writeWarningLine.bind(this._options.terminal)
    });
  }

  public generateTypings(): void {
    FileSystem.ensureEmptyFolder(this._options.generatedTsFolder);

    const filesToIgnore: Set<string> = new Set<string>((this._options.filesToIgnore!).map((fileToIgnore) => {
      return path.resolve(this._options.srcFolder, fileToIgnore);
    }));

    const locJsonFilePaths: string[] = glob.sync(
      path.join('**', '*.loc.json'),
      {
        root: this._options.srcFolder,
        absolute: true
      }
    );

    for (let locJsonFilePath of locJsonFilePaths) {
      locJsonFilePath = path.resolve(locJsonFilePath);

      if (filesToIgnore.has(locJsonFilePath)) {
        continue;
      }

      const locFileData: ILocFile = JsonFile.loadAndValidate(locJsonFilePath, Constants.LOC_JSON_SCHEMA);
      this._generateTypingsForLocFile(locJsonFilePath, locFileData);
    }

    const resxFiles: string[] = glob.sync(
      path.join('**', '*.resx'),
      {
        root: this._options.srcFolder,
        absolute: true
      }
    );

    for (let resxFilePath of resxFiles) {
      resxFilePath = path.resolve(resxFilePath);

      if (filesToIgnore.has(resxFilePath)) {
        continue;
      }

      const locFileData: ILocFile = ResxReader.readResxFileAsLocFile({ ...this._loggingOptions, resxFilePath });
      this._generateTypingsForLocFile(resxFilePath, locFileData);
    }
  }

  private _generateTypingsForLocFile(locFilePath: string, locFileData: ILocFile): void {
    const outputLines: string[] = [
      '// This file was generated by a tool. Modifying it will produce unexpected behavior',
      ''
    ];

    let indent: string = '';
    if (this._options.exportAsDefault) {
      outputLines.push(
        'export interface IStrings {'
      );

      indent = '  ';
    }

    for (const stringName in locFileData) { // eslint-disable-line guard-for-in
      const { comment } = locFileData[stringName];

      if (comment && comment.trim() !== '') {
        outputLines.push(
          `${indent}/**`,
          `${indent} * ${comment.replace(/\*\//g, '*\\/')}`,
          `${indent} */`
        );
      }

      if (this._options.exportAsDefault) {
        outputLines.push(
          `${indent}${stringName}: string;`,
          ''
        );
      } else {
        outputLines.push(
          `export declare const ${stringName}: string;`,
          ''
        );
      }
    }

    if (this._options.exportAsDefault) {
      outputLines.push(
        '}',
        '',
        'declare const strings: IStrings;',
        'export default strings;'
      );
    }

    const generatedTsFilePath: string = path.resolve(
      this._options.generatedTsFolder,
      path.relative(this._options.srcFolder, `${locFilePath}.d.ts`)
    );
    FileSystem.writeFile(generatedTsFilePath, outputLines.join(EOL), { ensureFolderExists: true });
  }
}
