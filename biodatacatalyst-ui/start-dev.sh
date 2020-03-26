docker run --name bdc-httpd -d -v $(pwd)/dev-cert:/usr/local/apache2/cert -v $(pwd)/httpd-vhosts-dev.conf:/usr/local/apache2/conf/extra/httpd-vhosts.conf -v $(pwd)/etc-hosts-dev:/etc/hosts -p 80:80 -p 443:443 local:httpd

