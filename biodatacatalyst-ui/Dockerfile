# Usage of IS_OPEN_ACCESS:
# The build stages are named based on the IS_OPEN_ACCESS flag to conditionally set up the server:
# - open_access_stage-false: Used when IS_OPEN_ACCESS is set to false, configuring for restricted access.
# - open_access_stage-true: Used when IS_OPEN_ACCESS is set to true, configuring for open access.

# Docker build stages are structured to accommodate different configurations based on the IS_OPEN_ACCESS value.
# The final image's IS_OPEN_ACCESS environment variable reflects the value passed during the build process.

ARG FILE_SUFFIX=development
ARG IS_OPEN_ACCESS

FROM hms-dbmi/pic-sure-hpds-ui:TARGET_BUILD_VERSION AS pic-sure-ui
FROM httpd:2.4.53-alpine as base

ARG FILE_SUFFIX
ENV FILE_SUFFIX=${FILE_SUFFIX}

# Replace virtual host config file with ours
COPY httpd-vhosts.conf ${HTTPD_PREFIX}/conf/extra/httpd-vhosts.conf

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

FROM base as open_access_stage-false
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

FROM open_access_stage-false as open_access_stage-true

# The build will fail if the open-pic-sure-bdc-frontend folder isn't there.
COPY open-pic-sure-bdc-frontend/ui/src/main/picsureui/ /usr/local/apache2/htdocs/picsureui/
COPY open-pic-sure-bdc-frontend/ui/src/main/psamaui/ /usr/local/apache2/htdocs/picsureui/psamaui/


ARG IS_OPEN_ACCESS
FROM open_access_stage-${IS_OPEN_ACCESS} as final_stage
# This stage will container the final image that will be used in deployment

ENV IS_OPEN_ACCESS=${IS_OPEN_ACCESS}
RUN echo "Final stage IS_OPEN_ACCESS: ${IS_OPEN_ACCESS}"