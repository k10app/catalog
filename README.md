# catalog

Fake server at this point

# Running
Replace $certpath with path to public.pub

```
docker run -p 80:80 -v $certpath:/catalog/certificates --rm -it --name catalog ghcr.io/k10app/catalog
```

# building
```
docker build -t ghcr.io/k10app/catalog .
```