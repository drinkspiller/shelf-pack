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
 * Options for configuring the ShelfPack instance.
 */
interface ShelfPackOptions {
    /**
     * If true, the packer will automatically grow its dimensions to accommodate
     * bins that don't fit.
     */
    autoResize?: boolean;
}
interface BinInput {
    w?: number;
    h?: number;
    width?: number;
    height?: number;
    id?: string | number;
}
type InputBin<T extends {
    inPlace?: boolean;
}> = T['inPlace'] extends true ? Bin : BinInput;
/**
 * Represents a rectangular area within the packer.
 */
declare class Bin {
    id: string | number;
    x: number;
    y: number;
    w: number;
    h: number;
    maxw: number;
    maxh: number;
    refcount: number;
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
    constructor(id: string | number, x: number, y: number, w: number, h: number, maxw?: number, maxh?: number, refcount?: number);
}
/**
 * Represents a horizontal row within the packer where bins can be placed.
 */
declare class Shelf {
    y: number;
    w: number;
    h: number;
    x: number;
    free: number;
    /**
     * Creates a new Shelf instance.
     * @param y Top coordinate of the shelf.
     * @param width Width of the shelf.
     * @param height Height of the shelf.
     * @param x The initial X position on the shelf
     */
    constructor(y: number, width: number, height: number, x?: number);
    /**
     * Attempts to allocate a bin on this shelf.
     * @param w Width of the bin to allocate.
     * @param h Height of the bin to allocate.
     * @param id Unique identifier for the bin.
     * @returns The allocated Bin, or null if allocation failed.
     */
    alloc(w: number, h: number, id: string | number): Bin | null;
    /**
     * Resizes the shelf to a new width.
     * @param w The new width of the shelf.
     */
    resize(w: number): void;
}
/**
 * A bin packing algorithm that uses the Shelf Best Height Fit strategy.
 */
declare class ShelfPack {
    /**
     * If true, the packer will automatically grow its dimensions to accommodate
     * bins that don't fit.
     */
    autoResize: boolean;
    /**
     * The list of shelves in the packer.
     */
    shelves: Shelf[];
    /**
     * The list of free bins available for reuse.
     */
    freebins: Bin[];
    /**
     * Statistics about the packed bins.
     */
    stats: Record<number, number>;
    /**
     * A map of packed bins, indexed by their unique identifiers.
     */
    bins: Record<string | number, Bin>;
    /**
     * The maximum ID used for a bin.
     */
    maxId: number;
    /**
     * The current width of the packer
     */
    w: number;
    /**
     * The current height of the packer
     */
    h: number;
    /**
     * Creates a new ShelfPack instance.
     * @param width Initial width of the packer.
     * @param height Initial height of the packer.
     * @param options Optional configuration options.
     */
    constructor(width?: number, height?: number, options?: ShelfPackOptions);
    /**
     * Packs multiple bins into the packer.
     * @param bins An array of bins to pack. Each bin should have `w` (or `width`) and `h` (or `height`) properties.
     * @param options Optional parameters.
     * @param options.inPlace If true, modifies the input `bins` array in-place, adding `x`, `y`, and `id` properties to each bin.
     * @returns An array of packed Bins.
     */
    pack<T extends {
        inPlace?: boolean;
    }>(bins: InputBin<T>[], options?: T): Bin[];
    /**
     * Packs a single bin into the packer.
     * @param w Width of the bin to pack.
     * @param h Height of the bin to pack.
     * @param id Optional unique identifier for the bin. If not provided, a new ID will be generated.
     * @returns The packed Bin, or null if the bin could not be packed.
     */
    packOne(w: number, h: number, id?: string | number): Bin | null;
    /**
     * Allocates a bin by reusing an existing free bin.
     * @param index The index of the free bin in the `freebins` array.
     * @param w The width of the bin to allocate.
     * @param h The height of the bin to allocate.
     * @param id The unique identifier for the bin.
     * @returns The allocated Bin.
     */
    private allocFreebin;
    /**
     * Allocates a bin on an existing shelf.
     * @param index The index of the shelf in the `shelves` array.
     * @param w The width of the bin to allocate.
     * @param h The height of the bin to allocate.
     * @param id The unique identifier for the bin.
     * @returns The allocated Bin.
     */
    private allocShelf;
    /**
     * Shrinks the width/height of the sprite to the bare minimum.
     * Since shelf-pack doubles first width, then height when running out of shelf space
     * this can result in fairly large unused space both in width and height if that happens
     * towards the end of bin packing.
     */
    shrink(): void;
    /**
     * Retrieves a packed bin by its ID.
     * @param id The unique identifier of the bin.
     * @returns The Bin, or undefined if no bin with the given ID is found.
     */
    getBin(id: string | number): Bin | undefined;
    /**
     * Increments the reference count of a bin.
     * @param bin The bin to increment the reference count of.
     * @returns The new reference count of the bin.
     */
    ref(bin: Bin): number;
    /**
     * Decrements the reference count of a bin.
     * If the reference count reaches 0, the bin is added to the `freebins` list
     * and removed from `bins`.
     * @param bin The bin to decrement the reference count of.
     * @returns The new reference count of the bin.
     */
    unref(bin: Bin): number;
    /**
     * Clears the packer, removing all bins and shelves.
     */
    clear(): void;
    /**
     * Resizes the packer to the given dimensions.
     * @param w The new width of the packer.
     * @param h The new height of the packer.
     * @returns True if the resize was successful, false otherwise.
     */
    resize(w: number, h: number): boolean;
}
export default ShelfPack;
