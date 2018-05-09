Manual de Request Control
=========================

Regla de Request Control
------------------------

Una regla de Request Control consiste en `Patrón`_, `Tipos`_ y `Acción`_.

Las peticiones que coinciden con un patrón y los tipos de una regla activa
serán interceptados tomando la acción de la regla.

Patrón
~~~~~~

El patrón se compone de `Esquema`_, `Servidor`_ y `Ruta`_. La regla
puede incluir de uno a muchos patrones.

Esquema
^^^^^^^

Los esquemas soportados en los patrones son ``http`` y ``https``.

+----------------+------------------------------------+
| ``http``       | Satisface un esquema http.         |
+----------------+------------------------------------+
| ``https``      | Satisface un esquema https.        |
+----------------+------------------------------------+
| ``http/https`` | Satisface esquemas http y https.   |
+----------------+------------------------------------+

Servidor
^^^^^^^^

El servidor puede coincidir con el de la URL de la petición
de las siguentes maneras:

+-----------------------+-----------------------+-----------------------+
| ``www.ejemplo.com``   | Satisface un          |                       |
|                       | servidor completo     |                       |
+-----------------------+-----------------------+-----------------------+
| ``*.ejemplo.com``     | Satisface el          | Satisfará cualquier   |
|                       | servidor dado y       | subdominio de, p.e.,  |
|                       | cualquiera de sus     | ejemplo.com           |
|                       | subdominios.          | **www**.ejemplo.com , |
|                       |                       | **bien**.ejemplo.com  |
+-----------------------+-----------------------+-----------------------+
| ``www.ejemplo.*``     | Satisface el          | Escriba los dominios  |
|                       | servidor y todos los  | de primer nivel en la |
|                       | dominios de primer    | lista de dominios de  |
|                       | nivel (se puede       | primer nivel (p.e.    |
|                       | combinar con la       | *com*, *org*).        |
|                       | restricción de        |                       |
|                       | subdominio)           |                       |
+-----------------------+-----------------------+-----------------------+
| ``*``                 | Satisface cualquier   |                       |
|                       | servidor.             |                       |
+-----------------------+-----------------------+-----------------------+

Ruta
^^^^

La ruta en el patrón subsecuentemente puede contener cualquier combinación
del comodín "\*" y cualquiera de los caracteres que están permitidos en la
ruta de la URL. El comodín "\*" satisface cualquier porción de la ruta, y
puede aparecer más de una vez.

Debajo tiene ejemplos para usar ruta en los patrones.

+-----------------------------------+-----------------------------------+
| ``*``                             | Satisface cualquier ruta.         |
+-----------------------------------+-----------------------------------+
| ``ruta/a/b/``                     | Satisface la ruta exacta          |
|                                   | "ruta/a/b/".                      |
+-----------------------------------+-----------------------------------+
| ``*b*``                           | Satisface cualquier ruta que      |
|                                   | contenga un componente "b" en     |
|                                   | en alguna posición intermedia.    |
+-----------------------------------+-----------------------------------+
|                                   | Satisface una ruta vacía.         |
+-----------------------------------+-----------------------------------+

Tipos
~~~~~

Un tipo indica el recurso solicitado. Una regla se puede aplicar de
uno a muchos tipos, o a cualquier tipo. Todos los tipos posibles están
listados debajo.

+-----------------------------------+-----------------------------------+
| Tipo                              | Detalles                          |
+===================================+===================================+
| Document                          | Indica un documento DOM en el     |
|                                   | nivel superior que es descargado  |
|                                   | directamente dentro de una        |
|                                   | pestaña del navegador             |
|                                   | (marco principal).                |
+-----------------------------------+-----------------------------------+
| Sub document                      | Indica un documento DOM que es    |
|                                   | descargado dentro de otro         |
|                                   | documento DOM (sub marco).        |
+-----------------------------------+-----------------------------------+
| Stylesheet                        | Indica una hoja de estilo         |
|                                   | (por ejemplo, elementos <style>). |
+-----------------------------------+-----------------------------------+
| Script                            | Indica un script ejecutable       |
|                                   | (como JavaScript).                |
+-----------------------------------+-----------------------------------+
| Image                             | Indica una imagen                 |
|                                   | (por ejemplo, elementos <img>).   |
+-----------------------------------+-----------------------------------+
| Object                            | Indica un objeto genérico.        |
+-----------------------------------+-----------------------------------+
| Plugin                            | Indica una petición realizada por |
|                                   | un plugin (object_subrequest).    |
+-----------------------------------+-----------------------------------+
| XMLHttpRequest                    | Indica una petición HTTP de XML.  |
|                                   | (XMLHttpRequest)                  |
+-----------------------------------+-----------------------------------+
| XBL                               | Indica una petición de vinculado  |
|                                   | (binding) XBL.                    |
+-----------------------------------+-----------------------------------+
| XSLT                              | Indica una transformación de      |
|                                   | hoja de estilo                    |
+-----------------------------------+-----------------------------------+
| Ping                              | Indica un ping inducido al pulsar |
|                                   | sobre un elemento <a> que usa el  |
|                                   | atributo ping. Sólo en uso si     |
|                                   | browser.send_pings está activado  |
|                                   | (predeterminado: falso).          |
+-----------------------------------+-----------------------------------+
| Beacon                            | Indica una petición `Beacon`_     |
|                                   | (de un elemento baliza).          |
+-----------------------------------+-----------------------------------+
| XML DTD                           | Indica una DTD (definición de     |
|                                   | tipo de documento) cargada por    |
|                                   | un documento XML.                 |
+-----------------------------------+-----------------------------------+
| Font                              | Indica una fuente cargada         |
|                                   | mediante una regla @font-face.    |
+-----------------------------------+-----------------------------------+
| Media                             | Indica la carga de un vídeo o     |
|                                   | audio.                            |
+-----------------------------------+-----------------------------------+
| WebSocket                         | Indica la carga de un             |
|                                   | `WebSocket`_.                     |
+-----------------------------------+-----------------------------------+
| CSP Report                        | Indica un informe `Content        |
|                                   | Security Policy`_ (política de    |
|                                   | seguridad de contenidos).         |
+-----------------------------------+-----------------------------------+
| Imageset                          | Indica una petición para cargar   |
|                                   | una <img> (con el atributo        |
|                                   | srcset) o <picture>.              |
+-----------------------------------+-----------------------------------+
| Web Manifest                      | Indica una petición para cargar   |
|                                   | un manifesto Web                  |
+-----------------------------------+-----------------------------------+
| Other                             | Indica una petición que no está   |
|                                   | clasificada como perteneciente a  |
|                                   | los tipos anteriores.             |
+-----------------------------------+-----------------------------------+

Acción
~~~~~~

|image4| Filtrado
    Cualquier petición que satisfaga una regla de filtrado será filtrada de acuerdo a la
	configuración de esta regla:

    - Con filtrado de redireccionamiento de URL la petición es guiada directamente a la URL
	de redireccionamiento contenida.
	- Con el recortado de parámetros de URL los parámetros de URL configurados se eliminarán de
	las peticiones.

|image5| Bloqueo
    Cualquier petición que satisfaga una regla de bloqueo será cancelada antes de efectuarse.

|image6| Redireccionamiento
    Cualquier petición que satisfaga una regla de redireccionamiento será redirigida a la URL
	de redireccionamiento configurada.

|image7| Lista blanca
    Cualquier petición que satisfaga una regla de lista blanca procederá normalmente sin que se
	tome ninguna acción de cualquiera de las otras reglas que también se satisfagan.

Prioridades de las reglas
---------------

1. Regla de lista blanca
2. Regla de bloqueo
3. Regla de redireccionamiento
4. Regla de filtrado

Las reglas de lista blanca tienen la prioridad más alta y revocan todas
las demás reglas. A continuación vienen las reglas de bloqueo que revocan
las reglas de redireccionamiento y filtrado. Finalmente las reglas de
redireccionamiento se aplicarán antes que las reglas de filtrado. Si más
de una regla de redireccionamiento o filtrado satisface una petición
única, todas se aplicarán de una en una.

Satisfacer con todas las URLs
----------------------------

El patrón de petición se puede establecer a un patrón global que se satisfaga
con todas las URLs bajo los esquemas soportados ("http" o "https") marcando
el botón Cualquier URL.

Recortar parámetros de URL
--------------------------

La regla de filtrado soporta el recorte de parámetro de consulta de URL.
Los parámetros de consulta de URL se usan comúnmente en la monitorización
de redireccionamiento como un método para analizar el origen del tráfico.
Los parámetros de URL recortados se definen bien como cadenas de texto
literales con soporte para comodín "*", o bien usando patrones en forma
de expresiones regulares (regexp).

Debajo tiene ejemplos de patrones de recortado de parámetro.

+------------+---------------------------------------+
| utm_source | Recorta cualquier                     |
|            | parámetro "utm_source"                |
+------------+---------------------------------------+
| utm\_\*    | Recorta cualquier parámetro que       |
|            | comience con "utm\_"                  |
+------------+---------------------------------------+
| /[0-9]+/   | Recorta cualquier parámetro que       |
|            | contenga sólo dígitos                 |
+------------+---------------------------------------+

Opción de recortado inverso
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Sólo mantiene los parámetros que están definidos en la lista de parámetros
de recortado. Todos los demás parámetros serán eliminados.

Opción recortar todos
~~~~~~~~~~~~~~~~~~~~~

Elimina todos los parámetros de consulta de la URL en la petición filtrada.

Redireccionamiento usando captura de patrón
-------------------------------------------

La regla de redireccionamiento soporta redirigir peticiones a una URL configurada manualmente. La
URL de redireccionamiento puede ser parametrizada usando expansión de parámetro e instrucciones
de redireccionamiento. La expansión de parámetro permite acceder a un conjunto de parámetros
nominados de la URL original. Las instrucciones de redireccionamiento se pueden usar para
modificar la petición inicial cambiando las partes de la URL original (ej. instruyendo a las
peticiones para que se redirijan a un puerto distinto).

Ambos métodos se pueden usar juntos. Las instrucciones de redireccionamiento serán interpretadas
y aplicadas a la URL de la petición primero, antes que la expansión de parámetro.

La expansión de parámetro también se puede usar dentro de una instrucción de redireccionamiento
permitiendo crear instrucciones de redireccionamiento basadas en la URL de la petición original.

Expansión de parámetro
~~~~~~~~~~~~~~~~~~~~~~

::

    {parámetro}

Accede a un parámetro nominado de la URL de la petición original. Los
parámetros nominados disponibles están listados al final de esta sección.
	
La expansión de parámetro soporta los siguientes formatos de manipulación
de cadena de texto:

Remplazado de subcadena
^^^^^^^^^^^^^^^^^^^^^^^

::

    {parámetro/patrón/remplazo}

Remplaza una subcadena de texto coincidente con el patrón en el
parámetro extraído. El patrón está escrito en forma de expresión regular.
Está soportada una variedad de argumentos de remplazo especiales, que se
describen debajo, incluyendo el referenciado a grupos/ocurrencias de la
subcadena capturada en el parámetro.

+-------+--------------------------------------------------------------+
| `$n`  | Inserta el n-esimo grupo capturado contando desde 1.         |
+-------+--------------------------------------------------------------+
| `$\`` | Inserta la porción de la cadena de texto que precede a la    |
|       | subcadena coincidente.                                       |
+-------+--------------------------------------------------------------+
| `$'`  | Inserta la porción de la cadena de texto que sigue a la      |
|       | subcadena coincidente.                                       |
+-------+--------------------------------------------------------------+
| `$&`  | Inserta la subcadena coincidente.                            |
+-------+--------------------------------------------------------------+
| `$$`  | Inserta un "$".                                              |
+-------+--------------------------------------------------------------+

Extracción de subcadena
^^^^^^^^^^^^^^^^^^^^^^^

::

    {parámetro:compensación:tamaño}

Extrae una parte del parámetro expandido. La compensación determina la
posición inicial. Empieza desde 0 y puede ser un valor negativo contando
desde el final de la cadena de texto.

Combinar reglas de manipulación
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

::

    {parámetro(manipulación1)|(manipulación2)|...|(manipulaciónN)}

Todas las reglas de manipulación de cadena de texto pueden
concatenarse usando un caracter "|" (pleca/barra vertical/tubo/pipe).
La salida es el resultado de las manipulaciones de la cadena.

Ejemplos
^^^^^^^^

+-------------------------------+---------------------------------------+
| \https://{nombredeservidor}/  | Usa el nombre de servidor de la       |
| nueva/ruta                    | petición original.                    |
+-------------------------------+---------------------------------------+
| \https://{nombredeservidor/   | Captura una parte del nombre de       |
| ([a-z]{2}).*/$1}/nueva/ruta   | servidor de la petición original.     |
+-------------------------------+---------------------------------------+
| \https://{nombredeservidor::  | Usa el nombre de servidor de la       |
| -3|/.co/.com}/nueva/ruta      | petición original pero manipula su    |
|                               | longitud acortándolo en 3 por el      |
|                               | final, y remplaza ".co" con ".com"    |
+-------------------------------+---------------------------------------+

Instrucción de redireccionamiento
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

    [parámetro=valor]

Remplaza una cierta parte de la petición original. Los parámetros nominados disponibles están
listados al final de esta sección.

El valor de una instrucción de redireccionamiento se puede parametrizar usando la expansión de
parámetro descrita anteriormente.

::

    [parámetro={parámetro<manipulaciones>}]

Ejemplos
^^^^^^^^

+----------------------------------------------+-----------------------------------------+
| [port=8080]                                  | Redirige la petición original al        |
|                                              | puerto 8080.                            |
+----------------------------------------------+-----------------------------------------+
| [port=8080][hostname=localhost]              | Redirige la petición original al        |
|                                              | puerto 8080 de localhost.               |
+----------------------------------------------+-----------------------------------------+
| [port=8080][hostname=localhost][hash={ruta}] | Redirige la petición original al        |
|                                              | puerto 8080 de localhost donde el hash  |
|                                              | es la ruta de la petición original.     |
+----------------------------------------------+-----------------------------------------+

Lista de parámetros nominados
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Los nombres de los parámetros soportados y sus salidas de ejemplo están
listados en la tabla de debajo.

Dirección de ejemplo usada como entrada:

::

    https://www.ejemplo.com:8080/alguna/ruta?query=valor#hash

+------------------------+---------------------------------------------------------------+
| Nombre                 | Salida                                                        |
+========================+===============================================================+
| protocol (protocolo)   | ``https:``                                                    |
+------------------------+---------------------------------------------------------------+
| hostname               | ``www.ejemplo.com``                                           |
| (nombre del servidor)  |                                                               |
+------------------------+---------------------------------------------------------------+
| port (puerto)          | ``8080``                                                      |
+------------------------+---------------------------------------------------------------+
| pathname (ruta)        | ``/alguna/ruta``                                              |
+------------------------+---------------------------------------------------------------+
| search (búsqueda)      | ``?query=valor``                                              |
+------------------------+---------------------------------------------------------------+
| hash (identificador)   | ``#hash``                                                     |
+------------------------+---------------------------------------------------------------+
| host (servidor)        | ``www.ejemplo.com:8080``                                      |
+------------------------+---------------------------------------------------------------+
| origin (origen)        | ``https://www.ejemplo.com:8080``                              |
+------------------------+---------------------------------------------------------------+
| href (referencia html) | ``https://www.ejemplo.com:8080/alguna/ruta?query=valor#hash`` |
+------------------------+---------------------------------------------------------------+

Esta página de manual está elaborada sobre el material de los siguientes
documentos del wiki de MDN, y está licenciada bajo `CC-BY-SA 2.5`_.

1. `Match patterns`_ por `Mozilla Contributors`_
   licenciado bajo   `CC-BY-SA 2.5`_.
2. `webRequest.ResourceType`_ por `Mozilla
   Contributors <https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/ResourceType$history>`__
   licenciado bajo `CC-BY-SA 2.5`_.
3. `URL`_ por `Mozilla
   Contributors <https://developer.mozilla.org/en-US/docs/Web/API/URL$history>`__
   licenciado bajo `CC-BY-SA 2.5`_.
4. `nsIContentPolicy`_ por `Mozilla
   Contributors <https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIContentPolicy$history>`__
   licenciado bajo `CC-BY-SA 2.5`_.

.. _Beacon: https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API
.. _WebSocket: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
.. _Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
.. _CC-BY-SA 2.5: http://creativecommons.org/licenses/by-sa/2.5/
.. _Match patterns: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns
.. _Mozilla Contributors: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns$history
.. _webRequest.ResourceType: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/ResourceType
.. _URL: https://developer.mozilla.org/en-US/docs/Web/API/URL
.. _nsIContentPolicy: https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIContentPolicy

.. |image0| image:: /icons/icon-filter@19.png
.. |image1| image:: /icons/icon-block@19.png
.. |image2| image:: /icons/icon-redirect@19.png
.. |image3| image:: /icons/icon-whitelist@19.png
.. |image4| image:: /icons/icon-filter@19.png
.. |image5| image:: /icons/icon-block@19.png
.. |image6| image:: /icons/icon-redirect@19.png
.. |image7| image:: /icons/icon-whitelist@19.png
