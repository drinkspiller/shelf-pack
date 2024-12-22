/**
 * @fileoverview
 *
 * ShelfPack is a JavaScript library for efficiently packing rectangular items
 * (bins) into a larger container (sprite) using a bin packing algorithm. It
 * employs the Shelf Best Height Fit strategy to minimize wasted space.
 *
 * An Analogy: The Bookshelf
 *
 * Imagine a ShelfPack instance as managing a physical bookshelf:
 *
 *     - `ShelfPack` instance: entire bookshelf.
 *     - `this.shelves`: The horizontal shelves on the bookshelf.
 *     - `Bin` objects: The rectangular items (e.g., books) being placed on the
 *        shelves.
 *     - `this.freebins`: A box of "available" books that have been removed
 *        from the shelf and can be reused.
 *     - `this.bins`: A record of all the books currently placed on the
 *        bookshelf, and how many times each has been requested.
 *
 * # Core Concepts:
 *
 * ## Bins
 *  Bins (e.g. 'items', 'elements', 'books') represent an occupied space of a
 * certain size. Each bin has a width (`w`), height (`h`), and a unique
 * identifier (`id`). Think of `this.bins` as a bookshelf with books on it.
 *
 * ## Shelves
 * Shelves are _Horizontal Rows_ within the container where bins are placed.
 * New shelves are created as needed to accommodate bins that don't fit on
 * existing shelves. Think of `this.shelves` as, er, the 'shelves' on a
 * bookshelf.
 *
 * ## Freebins
 * Freebins are a list of previously allocated bins that have been released
 * (i.e. have `refcount === 0`) and are available for reuse. Think of `freebins`
 *  as books that were taken off the shelf and put into a special
 * "available books" box (`this.freebins`). The space these books recently
 * occupied can be checked for fit when another book is being placed on a shelf.
 * If it fits, the book can be placed there.
 *
 * ## Shelf Best Height Fit
 * The algorithm prioritizes:
 *      1. Reusing existing `freebins` if they are an exact match or have
 *         minimal wasted space.
 *      2. Placing bins on shelves with the closest matching height to minimize
 *         wasted vertical space.
 *      3. Creating new shelves as needed.
 *
 * ## Auto Resize
 * If enabled (`{autoResize: true}`), the container will automatically grow to
 * accommodate bins that don't fit within the current dimensions.
 *
 * ## Refcounting
 * Reference counting Bins keeps track of how many a bin has been allocated.
 * Use `.ref()` to increment and `.unref()` to decrement the count. When the
 * count reaches 0, the bin is freed.
 *
 * # Usage
 *
 * 1. Create a ShelfPack instance
 *    `const packer = new ShelfPack(width, height, options);`
 * 2. Pack bins
 *    `packer.pack(bins, options);` or `packer.packOne(w, h, id);`
 * 3. Retrieve a bin
 *    `packer.getBin(id);`
 * 4. Manage bin references
 *    `packer.ref(bin);` and `packer.unref(bin);`
 * 5. Resize the container
 *    `packer.resize(width, height);`
 * 6. Clear the container
 *    `packer.clear();`
 */
/**
 * Represents a rectangular area within the packer.
 */
class Bin {
    /**
     * Creates a new Bin instance.
     * @param id Unique identifier for the bin.
     * @param x Left coordinate of the bin.
     * @param y Top coordinate of the bin.
     * @param w Width of the bin.
     * @param h Height of the bin.
     * @param maxw Maximum width the bin can occupy.
     * @param maxh Maximum height the bin can occupy.
     * @param refcount The number of references to this bin.
     */
    constructor(id, x, y, w, h, maxw = w, maxh = h, refcount = 0) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.maxw = maxw;
        this.maxh = maxh;
        this.refcount = refcount;
    }
}
/**
 * Represents a horizontal row within the packer where bins can be placed.
 */
class Shelf {
    /**
     * Creates a new Shelf instance.
     * @param y Top coordinate of the shelf.
     * @param width Width of the shelf.
     * @param height Height of the shelf.
     * @param x The initial X position on the shelf
     */
    constructor(y, width, height, x = 0) {
        this.y = y;
        this.w = width;
        this.h = height;
        this.x = x;
        this.free = width;
    }
    /**
     * Attempts to allocate a bin on this shelf.
     * @param w Width of the bin to allocate.
     * @param h Height of the bin to allocate.
     * @param id Unique identifier for the bin.
     * @returns The allocated Bin, or null if allocation failed.
     */
    alloc(w, h, id) {
        if (w > this.free || h > this.h) {
            return null;
        }
        const x = this.x;
        this.x += w;
        this.free -= w;
        return new Bin(id, x, this.y, w, h, w, this.h);
    }
    /**
     * Resizes the shelf to a new width.
     * @param w The new width of the shelf.
     */
    resize(w) {
        this.free += w - this.w;
        this.w = w;
    }
}
/**
 * A bin packing algorithm that uses the Shelf Best Height Fit strategy.
 */
class ShelfPack {
    /**
     * Creates a new ShelfPack instance.
     * @param width Initial width of the packer.
     * @param height Initial height of the packer.
     * @param options Optional configuration options.
     */
    constructor(width = 64, height = 64, options) {
        const opts = options !== null && options !== void 0 ? options : {};
        this.autoResize = !!opts.autoResize;
        this.shelves = [];
        this.freebins = [];
        this.stats = {};
        this.bins = {};
        this.maxId = 0;
        this.w = width;
        this.h = height;
    }
    /**
     * Packs multiple bins into the packer.
     * @param bins An array of bins to pack. Each bin should have `w` (or `width`) and `h` (or `height`) properties.
     * @param options Optional parameters.
     * @param options.inPlace If true, modifies the input `bins` array in-place, adding `x`, `y`, and `id` properties to each bin.
     * @returns An array of packed Bins.
     */
    pack(bins, options = {}) {
        const binsCopy = [...bins];
        const results = [];
        for (let i = 0; i < binsCopy.length; i++) {
            const w = binsCopy[i].w || binsCopy[i].w;
            const h = binsCopy[i].h || binsCopy[i].h;
            const id = binsCopy[i].id;
            if (typeof w === 'number' && typeof h === 'number') {
                const allocation = this.packOne(w, h, id);
                if (!allocation) {
                    continue;
                }
                if (options.inPlace) {
                    if ('x' in binsCopy[i] && 'y' in binsCopy[i]) {
                        const bin = bins[i];
                        bin.x = allocation.x;
                        bin.y = allocation.y;
                        bin.id = allocation.id;
                    }
                    results.push(allocation);
                }
            }
        }
        this.shrink();
        return results;
    }
    /**
     * Packs a single bin into the packer.
     * @param w Width of the bin to pack.
     * @param h Height of the bin to pack.
     * @param id Optional unique identifier for the bin. If not provided, a new ID will be generated.
     * @returns The packed Bin, or null if the bin could not be packed.
     */
    packOne(w, h, id) {
        const best = {
            freebin: -1,
            shelf: -1,
            waste: Infinity,
        };
        let y = 0;
        let bin;
        let shelf;
        let waste;
        let i;
        let finalId;
        // If id was supplied, attempt a lookup..
        if (typeof id === 'string' || typeof id === 'number') {
            bin = this.getBin(id);
            if (bin) {
                // We packed this bin already.
                this.ref(bin);
                return bin;
            }
            finalId = id;
        }
        else {
            finalId = ++this.maxId;
        }
        // First try to reuse a free bin..
        for (i = 0; i < this.freebins.length; i++) {
            bin = this.freebins[i];
            // Exactly the right height and width, use it..
            if (h === bin.maxh && w === bin.maxw) {
                return this.allocFreebin(i, w, h, finalId);
            }
            // Not enough height or width, skip it..
            if (h > bin.maxh || w > bin.maxw) {
                continue;
            }
            // Extra height or width, minimize wasted area..
            if (h <= bin.maxh && w <= bin.maxw) {
                waste = bin.maxw * bin.maxh - w * h;
                if (waste < best.waste) {
                    best.waste = waste;
                    best.freebin = i;
                }
            }
        }
        // Next find the best shelf..
        for (i = 0; i < this.shelves.length; i++) {
            shelf = this.shelves[i];
            y += shelf.h;
            // Not enough width on this shelf, skip it..
            if (w > shelf.free) {
                continue;
            }
            // Exactly the right height, pack it..
            if (h === shelf.h) {
                return this.allocShelf(i, w, h, finalId);
            }
            // Not enough height, skip it..
            if (h > shelf.h) {
                continue;
            }
            // Extra height, minimize wasted area..
            if (h < shelf.h) {
                waste = (shelf.h - h) * w;
                if (waste < best.waste) {
                    best.freebin = -1;
                    best.waste = waste;
                    best.shelf = i;
                }
            }
        }
        if (best.freebin !== -1) {
            return this.allocFreebin(best.freebin, w, h, finalId);
        }
        if (best.shelf !== -1) {
            return this.allocShelf(best.shelf, w, h, finalId);
        }
        // No free bins or shelves.. add shelf..
        if (h <= this.h - y && w <= this.w) {
            shelf = new Shelf(y, this.w, h);
            return this.allocShelf(this.shelves.push(shelf) - 1, w, h, finalId);
        }
        // No room for more shelves..
        // If `autoResize` option is set, grow the sprite as follows:
        //  * double whichever sprite dimension is smaller (`w1` or `h1`)
        //  * if sprite dimensions are equal, grow width before height
        //  * accommodate very large bin requests (big `w` or `h`)
        if (this.autoResize) {
            let h1, h2, w1, w2;
            h1 = h2 = this.h;
            w1 = w2 = this.w;
            if (w1 <= h1 || w > w1) {
                // Grow width..
                w2 = Math.max(w, w1) * 2;
            }
            if (h1 < w1 || h > h1) {
                // Grow height..
                h2 = Math.max(h, h1) * 2;
            }
            this.resize(w2, h2);
            return this.packOne(w, h, finalId); // Retry.
        }
        return null;
    }
    /**
     * Allocates a bin by reusing an existing free bin.
     * @param index The index of the free bin in the `freebins` array.
     * @param w The width of the bin to allocate.
     * @param h The height of the bin to allocate.
     * @param id The unique identifier for the bin.
     * @returns The allocated Bin.
     */
    allocFreebin(index, w, h, id) {
        const bin = this.freebins.splice(index, 1)[0];
        const newBin = new Bin(id, bin.x, bin.y, w, h, bin.maxw, bin.maxh, 0);
        this.bins[id] = newBin;
        this.ref(newBin);
        return newBin;
    }
    /**
     * Allocates a bin on an existing shelf.
     * @param index The index of the shelf in the `shelves` array.
     * @param w The width of the bin to allocate.
     * @param h The height of the bin to allocate.
     * @param id The unique identifier for the bin.
     * @returns The allocated Bin.
     */
    allocShelf(index, w, h, id) {
        const shelf = this.shelves[index];
        const bin = shelf.alloc(w, h, id);
        if (bin === null) {
            throw new Error('Failed to allocate bin on shelf.');
        }
        this.bins[id] = bin;
        this.ref(bin);
        return bin;
    }
    /**
     * Shrinks the width/height of the sprite to the bare minimum.
     * Since shelf-pack doubles first width, then height when running out of shelf space
     * this can result in fairly large unused space both in width and height if that happens
     * towards the end of bin packing.
     */
    shrink() {
        if (this.shelves.length > 0) {
            let w2 = 0;
            let h2 = 0;
            for (let j = 0; j < this.shelves.length; j++) {
                const shelf = this.shelves[j];
                h2 += shelf.h;
                w2 = Math.max(shelf.w - shelf.free, w2);
            }
            this.resize(w2, h2);
        }
    }
    /**
     * Retrieves a packed bin by its ID.
     * @param id The unique identifier of the bin.
     * @returns The Bin, or undefined if no bin with the given ID is found.
     */
    getBin(id) {
        return this.bins[id];
    }
    /**
     * Increments the reference count of a bin.
     * @param bin The bin to increment the reference count of.
     * @returns The new reference count of the bin.
     */
    ref(bin) {
        if (++bin.refcount === 1) {
            // A new Bin.. record height in stats histogram..
            this.stats[bin.h] = (this.stats[bin.h] | 0) + 1;
        }
        return bin.refcount;
    }
    /**
     * Decrements the reference count of a bin.
     * If the reference count reaches 0, the bin is added to the `freebins` list
     * and removed from `bins`.
     * @param bin The bin to decrement the reference count of.
     * @returns The new reference count of the bin.
     */
    unref(bin) {
        if (bin.refcount === 0) {
            return 0;
        }
        if (--bin.refcount === 0) {
            this.stats[bin.h]--;
            delete this.bins[bin.id];
            this.freebins.push(bin);
        }
        return bin.refcount;
    }
    /**
     * Clears the packer, removing all bins and shelves.
     */
    clear() {
        this.shelves = [];
        this.freebins = [];
        this.stats = {};
        this.bins = {};
        this.maxId = 0;
    }
    /**
     * Resizes the packer to the given dimensions.
     * @param w The new width of the packer.
     * @param h The new height of the packer.
     * @returns True if the resize was successful, false otherwise.
     */
    resize(w, h) {
        this.w = w;
        this.h = h;
        for (let i = 0; i < this.shelves.length; i++) {
            this.shelves[i].resize(w);
        }
        return true;
    }
}

export { ShelfPack as default };
