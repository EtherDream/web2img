# Web2Img

Web2Img is a tool to bundle your web files into a single image, and extract them via Service Worker at runtime.

You can use image hosting sites as free CDNs to save bandwidth costs.

![](assets/img/intro.png)

## Example

Demo: [https://fanhtml5.github.io](https://fanhtml5.github.io)

Target Files: https://github.com/fanhtml5/fanhtml5.github.io (only 2 files)

Source Files: https://github.com/fanhtml5/test-site


## Tool

web: https://etherdream.github.io/web2img/ or https://etherdream.com/web2img/


cli: TODO...

## FAQ

Q: Is free CDN safe?

A: Yes, the program will verify the data integrity.

----

Q: Is free CDN stable?

A: Not sure, but you can provide multiple URLs to improve stability.

----

Q: Can any free CDN be used?

A: No, CDN must enable CORS, allow empty referrer and "null" origin (or real value).

----

Q: Would it be better to optimize the image before uploading?

A: If the server will re-encode the image, it make no difference.

----

Q: Why use `404.html`?

A: It's an easy way to intercept any path.

----

Q: How to update files?

A: Just overwrite `x.js`, the client polls this file every 2 minutes.

----

Q: What if the browser doesn't support Service Wokrer?

A: Unfortunately, the page can't be displayed. You can add a fallback in `404.html`.

----

Q: Will new features be added?

A: This project is just an experiment, there is a new project named [freecdn](https://github.com/EtherDream/freecdn) which is much more powerful. (better docs will be released soon)


## License

MIT