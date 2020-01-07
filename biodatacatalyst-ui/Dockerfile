FROM dbmi/pic-sure-hpds-ui:master.0800720 AS pic-sure-ui
FROM dbmi/pic-sure-auth-ui:fence-integration.7e46cdb1fe84 as psama-ui
FROM httpd:2.4.27-alpine

# Replace virtual host config file with ours
COPY httpd-vhosts.conf ${HTTPD_PREFIX}/conf/extra/httpd-vhosts.conf
COPY DataStage-logo.png ${HTTPD_PREFIX}/htdocs/

# Enable virtual hosting config file
RUN sed -i '/^#Include conf.extra.httpd-vhosts.conf/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf

# Enable necessary proxy modules
RUN sed -i '/^#LoadModule proxy_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i  '/^#LoadModule proxy_http_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule proxy_connect_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf

#### SSL ####
# enable ssl
RUN sed -i '/^#LoadModule ssl_module modules\/mod_ssl.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule rewrite_module modules\/mod_rewrite.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule socache_shmcb_module modules\/mod_socache_shmcb.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN mkdir /usr/local/apache2/logs/ssl_mutex

# copy pic-sure-hpds-ui and psama_ui repos
COPY --from=psama-ui /usr/local/apache2/htdocs/psamaui /usr/local/apache2/htdocs/psamaui
COPY --from=pic-sure-ui /usr/local/apache2/htdocs/picsureui /usr/local/apache2/htdocs/picsureui

# then copy overrides
COPY src/main/webapp/picsureui /usr/local/apache2/htdocs/picsureui/
COPY src/main/webapp/psamaui /usr/local/apache2/htdocs/psamaui/

COPY DataStage-logo.png ${HTTPD_PREFIX}/htdocs/picsureui/static/logo.png
COPY DataStage-logo.png ${HTTPD_PREFIX}/htdocs/images/logo.png
