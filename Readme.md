# muzovano
#### Prerequisites:
Since this tool is using __Spotify API__ to search releases by text query, you must have a `Spotify ID` and `Spotify Secret`. Go here https://developer.spotify.com/dashboard, click on __Create app__ and name it whatever you want. For `website` and `redirect url` you can add any links --- to your blog or website. Next click __Settings__ in top right corner and you will see __Client ID__. To get the __Spotify Secret__ click the link ___View client secret___. These two keys are required only the first time you run the script.

## Usage:
When you run `muzovano "text for search"` it shows you 3 search results. Choose what you need and press __Enter__. Usually, if you type both the artist and release name, the desired release will be the first in the search results.

### Disabling some effects:
`--noframe` - disable the frame
`--noshadow` - disable the shadow next to the frame
`--novignette` - disable vignette

### Strength of some effects (only for the vignette so far):
`—vignettestrength=[value from 0 to 100]` - changes the strength of the vignette - the percentage of transparency. The default is `50`.

### Colors
The script automatically extracts 6 colors from the cover and creates a palette.
A color palette consists of:
__1. Vibrant
2. DarkVibrant
3. LightVibrant
4. Muted
5. DarkMuted
6. LightMuted__

These colors can be used as values for some elements coloring.

---

#### Parameters for colors manipulation:
`accent` - color of elements: frame, text, logo and buttons. Default is `Vibrant`.
`start` - the color of the gradient from above. Default is `Vibrant`.
`end` - the color of the gradient from below. Default is `DarkMuted`.
`text` - text color. By default, it inherits the color from the `accent`. Has priority over `accent`.
`logo` - the color of the logo and buttons. By default, it inherits the color from the `accent`. Has priority over `accent`.
`frame` - the color of the frame. By default, it inherits the color from the `accent`. Has priority over `accent`.
`vignette` - vignette color. Defaults to `black`.
`shadow `- the color of the shadow next to the frame. Defaults to `black` with `50%` transparency.

Syntax:
`--[element_name]color=[value]`

Possible value formats for these variables are:
1. HEX format - `#ff0000`, `#0f0`
2. The name of the color - `red`, `white`, `blue` (available names here https://developer.mozilla.org/en-US/docs/Web/CSS/named-color)
3. Name or index from the palette - `Vibrant` or a value between `1` and `6`

Examples:
`muzovano "Gunship - Monster in Paradise" --accentcolor=red`
`muzovano "Gunship - Monster in Paradise" --accentcolor=#f00`
`muzovano "Gunship - Monster in Paradise" --accentcolor=3`
`muzovano "Gunship - Monster in Paradise" --accentcolor=LightVibrant`

#### Color modification

Setting colors manually is great, but sometimes we just need to make some of them lighter/darker.
For this, there are separate parameters for each color:
`--[element_name]darken=[value]`
`--[element_name]lighten=[value]`

Possible values are from `0` to `100`.
If you use both darken and lighten for the same element, the difference between them will be applied.

Examples:
`muzovano "Gunship - Monster in Paradise" --startlighten=20 --accentdarken=40`
___The top color of the gradient is 20% lighter, the accent is 40% darker___

`muzovano "Gunship - Monster in Paradise" --accentcolor=LightVibrant --accentlighten=10`
___Change the accent color to another one from the palette and make it 10% lighter___

`muzovano "Gunship - Monster in Paradise" --framelighten=50 --framedarken=60`
___At the output, we get a frame darker by 10% (60 - 50 = -10)___
