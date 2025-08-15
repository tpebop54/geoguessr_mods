import numpy as np
from PIL import Image
import matplotlib
from matplotlib import pyplot as plt

import ast
import shutil

from collections import namedtuple

plt.ion()
matplotlib.use('TkAgg')

_MERCATOR_BOUNDS = namedtuple('MERCATOR_BOUNDS', ['min_lat', 'max_lat', 'min_lng', 'max_lng'])
MERCATOR_BOUNDS = _MERCATOR_BOUNDS(
    min_lat=-85.0511287798066,
    max_lat=85.0511287798066,
    min_lng=-180,
    max_lng=180
)

def get_brightness_grid(image, nrows, ncols):
    """ Compute the average brightness of each grid cell in the image. """

    h, w = image.shape
    grid_h = h / nrows
    grid_w = w / ncols
    brightness_grid = np.zeros((nrows, ncols))
    for i in range(nrows):
        for j in range(ncols):
            row_start = int(round(i * grid_h))
            row_end = int(round((i + 1) * grid_h)) if i < nrows - 1 else h
            col_start = int(round(j * grid_w))
            col_end = int(round((j + 1) * grid_w)) if j < ncols - 1 else w
            grid = image[row_start:row_end, col_start:col_end]
            brightness_grid[i, j] = np.mean(grid)
    return brightness_grid


def make_grid(fname_img, fname_grid, nrows, ncols):
    """ Take heatmap image, convert to grayscale, and output a text file representing the weight distribution. """

    image = Image.open(fname_img)
    grayscale = np.array(image.convert('L'))
    brightness = get_brightness_grid(grayscale, nrows, ncols)
    weight_grid = brightness.tolist()
    with open(fname_grid, 'w') as fout:
        fout.write('[\n')
        for row in weight_grid:
            fout.write(f'    {row},\n')
        fout.write(']\n')


def read_weight_grid(fname):
    """ Read weight grid from a text file and return as numpy array. """

    with open(fname, 'r') as f:
        grid_str = f.read()
    grid_str = grid_str.strip()
    grid_list = ast.literal_eval(grid_str)
    return np.array(grid_list)


def generate_weighted_indices(weight_grid, nsamples):
    """ Generate weighted random indices based on the brightness grid. """

    flat_weights = weight_grid.flatten()
    flat_weights = flat_weights / np.sum(flat_weights)
    chosen = np.random.choice(len(flat_weights), size=nsamples, p=flat_weights)
    rows = chosen // weight_grid.shape[1]
    cols = chosen % weight_grid.shape[1]
    return np.vstack((rows, cols)).T


# --- Mercator projection helpers ---
def mercator_y_from_lat(lat):
    """Convert latitude to Mercator Y."""
    lat_rad = np.radians(lat)
    return np.log(np.tan(np.pi / 4 + lat_rad / 2))

def lat_from_mercator_y(y):
    """Convert Mercator Y to latitude."""
    return np.degrees(2 * np.arctan(np.exp(y)) - np.pi / 2)

def grid_indices_to_latlng(indices, grid_shape, bounds=MERCATOR_BOUNDS):
    """ Convert grid indices to latitude and longitude coordinates using Mercator projection. """

    nrows, ncols = grid_shape

    # Mercator Y bounds
    y_max = mercator_y_from_lat(bounds.max_lat)
    y_min = mercator_y_from_lat(bounds.min_lat)
    y_step = (y_max - y_min) / nrows

    # Compute Mercator Y for each row index
    ys = y_max - indices[:, 0] * y_step
    lats = lat_from_mercator_y(ys)

    # Longitude is still linear
    lng_step = (bounds.max_lng - bounds.min_lng) / ncols
    lngs = bounds.min_lng + indices[:, 1] * lng_step
    return np.vstack((lats, lngs)).T


def write_latlngs_js(latlngs, basename):
    fname = f"./data_out/heatmaps_js/{basename}.js"
    with open(fname, 'w') as f:
        f.write('THE_WINDOW.latlngs = THE_WINDOW.latlngs || {};\n\n')
        f.write(f'THE_WINDOW.latlngs.{basename} = [\n')
        for lat, lng in latlngs:
            f.write(f'    [{lat:.4f}, {lng:.4f}],\n')
        f.write('];\n')
    dest = f'../../data/lottery/heatmaps/{basename}.js'
    shutil.copyfile(fname, dest)


def plot_heatmap(latlngs, bin_size, basename):
    """ Make a pyplot plot to show the distribution of the points """
    plt.figure(figsize=(10, 6))
    lat_bins = np.arange(MERCATOR_BOUNDS.min_lat, MERCATOR_BOUNDS.max_lat + 1, bin_size)
    lng_bins = np.arange(MERCATOR_BOUNDS.min_lng, MERCATOR_BOUNDS.max_lng + 1, bin_size)
    plt.hist2d(
        latlngs[:, 1], latlngs[:, 0],
        bins=[lng_bins, lat_bins],
        cmap='hot',
        range=[[MERCATOR_BOUNDS.min_lng, MERCATOR_BOUNDS.max_lng], [MERCATOR_BOUNDS.min_lat, MERCATOR_BOUNDS.max_lat]]
    )
    plt.colorbar(label='Sample Count')
    plt.colorbar(label='Sample Count')
    plt.xlabel('Longitude')
    plt.ylabel('Latitude')
    plt.title(basename)
    plt.savefig(f'./data_out/heatmaps_png/{basename}.png')
    plt.show()

def main(basename, nrows, ncols, nsamples, bin_size=2):
    fname_heatmap = f'./data_in/heatmaps/{basename}.png'
    fname_grid = f'./data_out/weight_grids/{basename}.txt'

    nrows = int(nrows)
    ncols = int(ncols)

    make_grid(fname_heatmap, fname_grid, nrows, ncols)
    weight_grid = read_weight_grid(fname_grid)
    indices = generate_weighted_indices(weight_grid, nsamples)
    latlngs = grid_indices_to_latlng(indices, (nrows, ncols))
    latlngs[:, 0] = np.clip(latlngs[:, 0], MERCATOR_BOUNDS.min_lat, MERCATOR_BOUNDS.max_lat)
    latlngs[:, 1] = np.clip(latlngs[:, 1], MERCATOR_BOUNDS.min_lng, MERCATOR_BOUNDS.max_lng)
    plot_heatmap(latlngs, bin_size=bin_size, basename=basename)
    write_latlngs_js(latlngs, basename)


_HEATMAP = namedtuple('_HEATMAPS', ['name', 'npoints'])

_TO_MAP = [
    _HEATMAP(name='world', npoints=64800), # 180*360
    _HEATMAP(name='europe', npoints=10000),
]


if __name__ == '__main__':
    for heatmap in _TO_MAP:
        main(
            basename=heatmap.name,
            nrows=np.floor(MERCATOR_BOUNDS.max_lat - MERCATOR_BOUNDS.min_lat), # Keep everything scaled the same for maps and sub-maps to avoid confusion.
            ncols=np.floor(MERCATOR_BOUNDS.max_lng - MERCATOR_BOUNDS.min_lng),
            nsamples=heatmap.npoints,
        bin_size=1,
    )
