# Lottery Behind-the-Scenes

## How the distribution map is built

### Step 1: Get a map that shows street view distribution.

See https://education.openguessr.com/guides/read/beginner/coverage for the actual distribution. Ideally, we could just read the street view data directly, but instead, we're going to make a customized map and then do some image processing to fine tune it.

Generate a stylized Google Map that shows the water as black and the land as white, with Google Maps street view shown as blue.

This will give a rough approximation of the density of how the lottery should place its guesses so we don't just get a bunch of ocean plonks. It does not need to be perfect as long as the latitude and longitude are correctly aligned with the Mercator projection as seen on Google Maps.

See `basemap_builder.html` for how this map is constructed. You can host this file locally and mess with the map settings to achieve proper contrasts.

From here, take screenshots of the hosted page, and put them in an image editor. Since the full map does not ft on a single web page, you likely have to manually stitch together two screenshots.

The resulting image needs to be an exact square, with -180 deg. longitude being on the left, +180 on the right, then -90 deg latitude on the bottom and +90 on the top. Get this precise down to the pixel.

### Step 2: Clean up the map

Using an image editor, manually draw over the spliced map image to fine tune how the guess distribution will work.

The resulting distribution is based  on pixel intensity. The image is divided into 1 degree by 1 degree blocks for the entire map, and then it takes the average pixel brightness for that region. So, since the ocean is black, it won't plonk there.

### Step 3:

Run the python script to convert this information into a list of potential guesses for the lottery mod. All of the heavy processing is done on the Python side, and the output is a simple .js file that contains a list of many thousands of guesses that the lottery can make.

It's not random in the true sense, but it creates a distribution that roughly maps the world coverage of Geoguessr.

The resulting file will be put in the `data_out` directory, where it can be copied and pasted to the base `data` folder for the JavaScript side to injest as a simple array from which it will choose a random location.

To weight certain areas more than others on the map, you can create additional point distributions for those areass. On the javascript side, all of the arrays in the heatmaps folder will be concatenated.

## To run it

`python main.py` (you can go into the file and adjust settings as needed)

