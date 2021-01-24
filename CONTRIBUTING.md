## Subresource Integrity 

Make sure all HTML resources such as javascript and css files include the
`integrity` attribute.

Use the [SRI Hash Generator](https://www.srihash.org/) to calculate the
integrity hash then attach it in an HTML tag:

```html
<link rel="stylesheet" href="https://..." integrity="sha384-..." crossorigin="anonymous" />
<script type="text/javascript" src="https://..." integrity="sha384-..." crossorigin="anonymous"></script>
```
