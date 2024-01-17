

## Create local hosts entries

```sh
# Add to /etc/hosts for Ultri local dev
127.0.0.1 example.com api.example.com www.example.com
127.0.0.1 com.example.com api.com.example.com www.com.example.com
127.0.0.1 space.example.com api.space.example.com www.space.example.com
127.0.0.1 shop.example.com api.shop.example.com www.shop.example.com
```

## Checkout code

```sh
git clone git@github.com:Ultri-Izzup/activerules.git
cd activerules
```

## Create local certs

The hostnames should match what was created in the `/etc/hosts`.

```sh
mkdir certs
cd certs
mkcert example.com api.example.com www.example.com
mkcert com.example.com api.com.example.com www.com.example.com
mkcert space.example.com api.space.example.com www.space.example.com
mkcert shop.example.com api.shop.example.com www.shop.example.com
```





