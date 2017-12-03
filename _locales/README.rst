Translating Request Control
~~~~~~~~~~~~~~~~~~~~~~~~~~~

To begin translation copy **en** folder and its content to a new
directory and name it after the new locale.

**Note:** Separator for regional variant in directory name must be
written with underscore, e.g. "en_US".

Locale's directory content:

-  messages.json file - Includes all localised strings including
   extension's name and description.
-  manual.rst - The localised manual written in reStructuredText.
   A Html page will be auto-generated from it using pandoc.
