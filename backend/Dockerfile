FROM node:24

#作業するフォルダを/appにする → 以降の処理は全部ここで行われる
WORKDIR /app 

#package.json と package-lock.json をコピー
COPY package*.json ./ 

#ライブラリをインストール
RUN npm install

#プロジェクトの全ファイルをコピー
COPY . .

#3000番ポートを使いますよ
EXPOSE 3000

#COPY package*.json ./ & RUN npm installを先にやる理由
#→依存が変わらない限り再インストールしなくていい = ビルドが早くなる（キャッシュ）