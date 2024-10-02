# Changelog

## [1.7.0](https://github.com/ZeitOnline/svelte-superforms-backoffice/compare/v1.6.0...v1.7.0) (2024-10-02)


### Features

* add right queries for patch both game and game_question ([8d47709](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/8d47709be579ffdeccae17b4fad59ef98e0f232f))
* check user if navigation is wanted when form is tainted ([5424c0b](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/5424c0ba255ac7818642a643973385b5d1d13a1f))
* create game and game questions in seperate, cascading methods ([1751de6](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/1751de657c8583a6dccba89fb9157f0301aa0704))
* handle patch, right validation and remove add and delete questions in edit mode ([caf9a34](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/caf9a343429432330236ee218ff0ac5ab2facf6e))
* make general improvements to validation ([eeb427a](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/eeb427a4c45180598edc526715103a142948a01d))
* Rework edit view ([20db26c](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/20db26c2c62c8ad4d249c7a819251cd624562cb7))
* send questions with the game ([89a12d2](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/89a12d2b9e7efbcbc641224cd6ba268eba91aa04))
* **validation:** feat(validation):  ([1026fc4](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/1026fc48f89c5d7e6d422d3149ce0250b7e719e5))
* **validation:** add individual error messages to cells of AddGameTable ([83c257e](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/83c257e327a8cb76a619ac47828d725fba3b7cd5))
* **validation:** improve style, error message and schema of the questions ([6719227](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/67192277b7ef82c551fa1b724ea1a529f4fc8d4b))
* **validation:** wip of the validation of the name and release_date fields ([961b653](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/961b653493af32ba4df10e1ecb3ed370968d0329))


### Bug Fixes

* add custom date only if no date is set ([ff6a4d9](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/ff6a4d9f1946ce45acc1134a06ac0be838a85e13))
* add global listener for a wider input file recognition ([1b2b972](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/1b2b972d1f4bc38c535b724b3705e99e90983479))
* **parsing:** remove lines after csv parsing if they are empty or have EOF character ([eff6978](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/eff6978d356127c19d126f8a9d25171e0fb3aaaf))
* persist form questions and taint form on changes ([11b1b86](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/11b1b86d9d69c00d47bdee9d6a61357a1af50077))
* reset form on back-navigation ([54a1d92](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/54a1d92aa24380347a004292703549ea730b3728))
* **validation:** add missing validation and error messages in game schema ([b8bb2ab](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/b8bb2abb4d6fc775c2223c177d80172145fc9c20))


### Performance Improvements

* **api:** fetch questions for game directly ([016160c](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/016160ccd23744b2fe81ede3f013817bece56dde))

## [1.6.0](https://github.com/ZeitOnline/svelte-superforms-backoffice/compare/v1.5.0...v1.6.0) (2024-09-06)


### Features

* add sort possibility to the table ([8a6a5d4](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/8a6a5d49a1cc769f5c40b1e80526f132ce9d31a4))
* improve delete game without questions ([d8b88d9](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/d8b88d95dbf826767685e65664674bb7ca947a1e))
* make improvements in the new game view ([332648e](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/332648e79b0041e8856988c1391f8851c1def83e))
* make provisional delete, post without questions and nice to have date default ([94e7e27](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/94e7e27b0002c04cfbfa387e7ab278790af4bc4f))

## [1.5.0](https://github.com/ZeitOnline/svelte-superforms-backoffice/compare/v1.4.0...v1.5.0) (2024-08-23)


### Features

* add icon handler with svelte ([a683d71](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/a683d714a18bf955965d1163c1c7e39a2a5fe6a2))
* add search questions in edit game ([ff00f78](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/ff00f78fa6f903a1629507052a9b2eef30f9d1ab))
* improve views and make everything consistent to german language ([ce9a806](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/ce9a806e5673d1bf27c423053b622d212c2893b5))
* refactor and several additions like client error validation ([2bf8acf](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/2bf8acf4c41ac3cc0ff4ae70857210539e20f703))

## [1.4.0](https://github.com/ZeitOnline/svelte-superforms-backoffice/compare/v1.3.0...v1.4.0) (2024-08-21)


### Features

* add some queries to handle db properly ([855bfc0](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/855bfc03605eaaf2a893725582bdc7eeadeaa147))

## [1.3.0](https://github.com/ZeitOnline/svelte-superforms-backoffice/compare/v1.2.0...v1.3.0) (2024-08-21)


### Features

* add pagination to the dashboard table ([7a45b68](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/7a45b680a30ccbe1388222bc3d3a27da674789fe))

## [1.2.0](https://github.com/ZeitOnline/svelte-superforms-backoffice/compare/v1.1.0...v1.2.0) (2024-08-21)


### Features

* create store a la svelte 5 ([de48d35](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/de48d3541d3adce0fe37857cc4aacd1e6049288f))
* fake edit and delete views ([518dbd6](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/518dbd63f57e8e995d3d29eae3db2abbb5115076))

## [1.1.0](https://github.com/ZeitOnline/svelte-superforms-backoffice/compare/v1.0.1...v1.1.0) (2024-08-21)


### Features

* add right tailwind classes and alias to the config ([f2b6fb0](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/f2b6fb096d923e07eea6cdd9b8fcb5a33a84ce73))
* add some functionalities for table search with fake data ([3a761e9](https://github.com/ZeitOnline/svelte-superforms-backoffice/commit/3a761e90881ff43b61db7d5059cca8be67847ed0))

## [1.0.1](https://github.com/ZeitOnline/4bild1wort-superforms/compare/v1.0.0...v1.0.1) (2024-08-20)


### Bug Fixes

* add fix to ci maybe ([39087da](https://github.com/ZeitOnline/4bild1wort-superforms/commit/39087da7565323a6b48f5c77398620ca498e80c3))

## 1.0.0 (2024-08-20)


### Features

* add header and better handling of newGameState ([60f3884](https://github.com/ZeitOnline/4bild1wort-superforms/commit/60f3884a279d4c250b9da54aab2e1cb8ce762f18))
* add initial commit with superforms installed ([aa22453](https://github.com/ZeitOnline/4bild1wort-superforms/commit/aa22453e66baf28c494e99d67ad43b27fef67282))
* add possibility of reading csv ([ca54432](https://github.com/ZeitOnline/4bild1wort-superforms/commit/ca54432031101391b44ed9acb4026a1cc7100bc8))
* add release please action ([be455ad](https://github.com/ZeitOnline/4bild1wort-superforms/commit/be455ad76c2afb329a7cf4f74c9d23eb6abbdef9))
* add tailwind and table with the result from csv parsed ([cb81163](https://github.com/ZeitOnline/4bild1wort-superforms/commit/cb81163d72f11ded7881caa198ff331a86a11f8e))
* add toast and improve code quality ([afbc2c6](https://github.com/ZeitOnline/4bild1wort-superforms/commit/afbc2c6b8b0ab00c2b4e28df2f3d0a16340d5b4e))
* create readme ([9de25b8](https://github.com/ZeitOnline/4bild1wort-superforms/commit/9de25b8bf84ac90ab9a219a60a1677c2cb1cdeec))
* improve svelte5 code and improve styling ([ce708b0](https://github.com/ZeitOnline/4bild1wort-superforms/commit/ce708b0379a864dd82ee299fa44d2512e64ccc83))
* start to handle the submit of the second form on the same page ([202c084](https://github.com/ZeitOnline/4bild1wort-superforms/commit/202c084094d5137440d7ecf7c2ee233ef336a9d6))


### Bug Fixes

* improve reactivity when onmount of addgametable ([55482ea](https://github.com/ZeitOnline/4bild1wort-superforms/commit/55482eaa060747b0d44a058723e87e14caebafaf))
