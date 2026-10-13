FROM php:8.2-apache

# Enable mod_rewrite
RUN a2enmod rewrite

# Install PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# ⚠️ مهم: DocumentRoot رو ببر به پوشه api
ENV APACHE_DOCUMENT_ROOT=/var/www/html/api
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Copy project
COPY . /var/www/html/

# Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 777 /var/www/html/uploads 2>/dev/null || true

# Allow .htaccess
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

EXPOSE 80