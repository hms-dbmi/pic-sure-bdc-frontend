ARG FILE_SUFFIX=development
FROM hms-dbmi/pic-sure-hpds-ui:TARGET_BUILD_VERSION AS pic-sure-ui
FROM httpd:2.4.53-alpine as core-ui

ARG FILE_SUFFIX
ENV FILE_SUFFIX=${FILE_SUFFIX}

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
RUN sed -i "s/DirectoryIndex index.html/DirectoryIndex index_${FILE_SUFFIX}.html/" ${HTTPD_PREFIX}/conf/httpd.conf
RUN mkdir /usr/local/apache2/logs/ssl_mutex

# Disable directory browsing
RUN sed -i 's/Options Indexes FollowSymLinks/Options -Indexes +FollowSymLinks/' ${HTTPD_PREFIX}/conf/httpd.conf

FROM core-ui
# copy pic-sure-hpds-ui repo
COPY --from=pic-sure-ui /usr/local/apache2/htdocs/picsureui /usr/local/apache2/htdocs/picsureui

# then copy overrides
COPY src/main/webapp/picsureui/ /usr/local/apache2/htdocs/picsureui/
COPY src/main/webapp/psamaui /usr/local/apache2/htdocs/picsureui/psamaui/
COPY src/main/resources/favicon.ico /usr/local/apache2/htdocs/
COPY src/main/resources/ /usr/local/apache2/htdocs/picsureui/images/

COPY --from=pic-sure-ui /usr/local/apache2/htdocs/picsureui/index.html /usr/local/apache2/htdocs/picsureui/index_${FILE_SUFFIX}.html
COPY --from=pic-sure-ui /usr/local/apache2/htdocs/picsureui/main.js /usr/local/apache2/htdocs/picsureui/main_${FILE_SUFFIX}.js

RUN sed -i "s/\/picsureui\/main/\/picsureui\/main_${FILE_SUFFIX}/" /usr/local/apache2/htdocs/picsureui/index_${FILE_SUFFIX}.html
RUN sed -i "s/urlArgs: \"\"/urlArgs: \"v=${FILE_SUFFIX}\"/" /usr/local/apache2/htdocs/picsureui/main_${FILE_SUFFIX}.js

COPY horizontal-logo.png ${HTTPD_PREFIX}/htdocs/picsureui/static/logo.png
COPY stacked-logo.png ${HTTPD_PREFIX}/htdocs/images/logo.png
COPY login_dots.png ${HTTPD_PREFIX}/htdocs/images/login_dots.png