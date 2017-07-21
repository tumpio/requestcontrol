### Translating Request Control

To begin translation copy __en__ folder and its content to a new directory and name it after the locale.

__Note:__ Separator for regional variant in directory name must be written with underscore, e.g. "en_US".

Locale's directory content:
- messages.json file - Includes all localised strings including extension's name and description. 
- manual.md - The localised manual written in markdown. Html page will be auto-generated from it using pandoc.
