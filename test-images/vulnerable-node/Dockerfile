FROM node:12.22.12-buster-slim

RUN apt-get update && apt-get install -y \
    openssh-server \
    netcat-openbsd \
    telnet \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir /var/run/sshd
RUN echo "root:toor" | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

WORKDIR /app

COPY app/package*.json ./
RUN npm install

COPY app/ .

EXPOSE 22 3000 9229

ENV NODE_ENV=development
ENV DEBUG=express:*
ENV JWT_SECRET=supersecretkey123
ENV DB_CONNECTION_STRING=mongodb://admin:password123@db-host:27017/admin
ENV AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
ENV AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

USER root

CMD /usr/sbin/sshd && node --inspect=0.0.0.0:9229 app.js
