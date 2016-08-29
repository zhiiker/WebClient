angular.module('proton.message')
    .directive('embeddedImgLoader', ($rootScope, embedded) => {

        /**
         * Remove the loader and display embedded images
         * @param  {Node} body Container body mail
         * @return {void}
         */
        const bindImagesUrl = (body) => {
            const $list = body ? body.querySelectorAll('[data-embedded-img]') : [];
            const promises = [].slice.call($list)
                .map((img) => {
                    const src = embedded.getUrl(img);
                    const image  = new Image();
                    return new Promise((resolve, reject) => {
                        image.src = src;
                        image.onload = () => resolve({img, src});
                        image.onerror = (error) => reject({ error, src });
                    });
                });

            Promise
                .all(promises)
                .then((images) => {
                    _rAF(() => {
                        images.forEach(({ img, src }) => {
                            img.src = src;
                            img.classList.add('proton-embedded');
                        });

                        // Remove all the loaders !
                        const loader = body ? body.querySelectorAll('.loading') : [];
                        if (loader.length) {
                            $(loader).contents().unwrap();
                        }

                        $rootScope.$emit('embedded.injected');
                    });
                })
                .catch(console.error);
        };

        return {
            link(scope, el) {
                const unsubscribe = $rootScope
                    .$on('embedded.loaded', () => {
                        // Need to build images after the $digest as we need the decrypted body to be already compiled
                        scope
                            .$applyAsync(() => {
                                bindImagesUrl(el[0].querySelector('.bodyDecrypted'));
                            });
                });

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });
