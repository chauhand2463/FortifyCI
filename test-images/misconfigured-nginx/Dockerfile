FROM nginx:1.14.2

RUN apt-get update && apt-get install -y \
    openssh-server \
    sudo \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN echo "root:P@ssw0rd!" | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

RUN useradd -m -s /bin/bash admin && echo "admin:admin" | chpasswd
RUN echo "admin ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

COPY nginx.conf /etc/nginx/nginx.conf
COPY site.conf /etc/nginx/conf.d/default.conf
COPY secret.txt /etc/nginx/secret.txt
COPY app/ /usr/share/nginx/html/

RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/selfsigned.key \
    -out /etc/nginx/ssl/selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Org/CN=localhost"

RUN echo "nginx:nginx" | chpasswd

EXPOSE 22 80 443 8080

ENV FLAG=CTF{fake_flag_for_testing}
ENV INTERNAL_API_KEY=sk-abcdef1234567890
ENV REDIS_URL=redis://:hunter2@redis-internal:6379

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

CMD service ssh start && nginx -g 'daemon off;'
